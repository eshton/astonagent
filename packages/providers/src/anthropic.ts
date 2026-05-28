import Anthropic from "@anthropic-ai/sdk";
import type {
  AstonMessage,
  ContentPart,
  GenerateRequest,
  Provider,
  ServerTool,
  StopReason,
  StreamEvent,
  ToolDef,
} from "@astonagent/core";
import { toolToJsonSchema } from "./tool-schema.js";

export interface AnthropicProviderOptions {
  apiKey?: string;
  model: string;
  /** Override the SDK client (useful for testing or custom transports). */
  client?: Anthropic;
  /** Default to 4096 if unset. */
  maxTokens?: number;
  /** Add an ephemeral cache_control breakpoint on the system prompt (default true). */
  cacheSystem?: boolean;
  /** Add an ephemeral cache_control on the most recent user-turn block (default true). */
  cacheLastUserTurn?: boolean;
}

type AnthropicBlock =
  | { type: "text"; text: string; cache_control?: { type: "ephemeral" } }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

type AnthropicMessage = { role: "user" | "assistant"; content: AnthropicBlock[] };

function partToAnthropic(part: ContentPart): AnthropicBlock | null {
  switch (part.type) {
    case "text":
      return { type: "text", text: part.text };
    case "image":
      return {
        type: "image",
        source: { type: "base64", media_type: part.mediaType, data: part.data },
      };
    case "tool_use":
      return { type: "tool_use", id: part.id, name: part.name, input: part.input ?? {} };
    case "tool_result":
      return {
        type: "tool_result",
        tool_use_id: part.toolUseId,
        content: typeof part.output === "string" ? part.output : JSON.stringify(part.output),
        is_error: part.isError,
      };
    default:
      // server_tool_use / server_tool_result are not replayed natively; the
      // assistant's text answer carries the information forward.
      return null;
  }
}

function toAnthropicMessages(messages: AstonMessage[]): AnthropicMessage[] {
  const out: AnthropicMessage[] = [];
  for (const m of messages) {
    if (m.role === "system") continue; // system is a separate parameter
    const role: "user" | "assistant" = m.role === "assistant" ? "assistant" : "user";
    const blocks = m.content.map(partToAnthropic).filter((b): b is AnthropicBlock => b !== null);
    if (blocks.length === 0) continue;
    out.push({ role, content: blocks });
  }
  return out;
}

function applyCaching(
  msgs: AnthropicMessage[],
  cacheLastUserTurn: boolean,
): AnthropicMessage[] {
  if (!cacheLastUserTurn || msgs.length === 0) return msgs;
  // Find the most recent user turn and mark its last text block as ephemeral
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i]!;
    if (m.role !== "user") continue;
    const lastTextIdx = [...m.content].reverse().findIndex((b) => b.type === "text");
    if (lastTextIdx === -1) break;
    const idx = m.content.length - 1 - lastTextIdx;
    const block = m.content[idx];
    if (block && block.type === "text") {
      m.content[idx] = { ...block, cache_control: { type: "ephemeral" } };
    }
    break;
  }
  return msgs;
}

function mapStopReason(reason: string | null | undefined): StopReason {
  switch (reason) {
    case "end_turn":
      return "end_turn";
    case "tool_use":
      return "tool_use";
    case "max_tokens":
      return "max_tokens";
    case "stop_sequence":
      return "stop_sequence";
    default:
      return "end_turn";
  }
}

function buildToolParam(tools: ToolDef[] | undefined, serverTools: ServerTool[] | undefined) {
  const out: Array<Record<string, unknown>> = [];
  for (const t of tools ?? []) {
    out.push({ name: t.name, description: t.description, input_schema: toolToJsonSchema(t) });
  }
  for (const st of serverTools ?? []) {
    if (st.type === "web_search") {
      out.push({ type: "web_search_20250305", name: "web_search", max_uses: st.maxUses ?? 5 });
    }
  }
  return out.length > 0 ? out : undefined;
}

export function anthropic(opts: AnthropicProviderOptions): Provider {
  // Construct the SDK client lazily so a missing API key only errors when this
  // provider is actually used to stream — not at import time.
  let client: Anthropic | undefined = opts.client;
  const getClient = (): Anthropic => {
    if (!client) {
      client = new Anthropic({ apiKey: opts.apiKey ?? process.env.ANTHROPIC_API_KEY });
    }
    return client;
  };
  const modelId = opts.model;
  const defaultMaxTokens = opts.maxTokens ?? 4096;
  const cacheSystem = opts.cacheSystem ?? true;
  const cacheLastUserTurn = opts.cacheLastUserTurn ?? true;

  return {
    id: "anthropic",
    modelId,
    capabilities: { webSearch: true },
    async *stream(req: GenerateRequest): AsyncIterable<StreamEvent> {
      const messages = applyCaching(toAnthropicMessages(req.messages), cacheLastUserTurn);
      const system = req.system
        ? cacheSystem
          ? [{ type: "text" as const, text: req.system, cache_control: { type: "ephemeral" as const } }]
          : req.system
        : undefined;

      const params: Anthropic.Messages.MessageCreateParamsStreaming = {
        model: modelId,
        max_tokens: req.maxTokens ?? defaultMaxTokens,
        temperature: req.temperature,
        system: system as Anthropic.Messages.MessageCreateParams["system"],
        messages: messages as Anthropic.Messages.MessageParam[],
        tools: buildToolParam(req.tools, req.serverTools) as Anthropic.Messages.Tool[] | undefined,
        stream: true,
      };

      const blockState = new Map<
        number,
        { kind: "text" | "tool_use" | "server_tool_use"; id?: string; name?: string; jsonBuf: string }
      >();
      let usage = { promptTokens: 0, completionTokens: 0, cachedTokens: 0 };
      let stopReason: StopReason = "end_turn";

      try {
        const stream = await getClient().messages.create(params, { signal: req.abortSignal });
        for await (const event of stream as AsyncIterable<Anthropic.Messages.RawMessageStreamEvent>) {
          switch (event.type) {
            case "message_start": {
              const u = event.message.usage;
              usage.promptTokens = u.input_tokens ?? 0;
              const cached = (u as unknown as { cache_read_input_tokens?: number; cache_creation_input_tokens?: number });
              usage.cachedTokens = (cached.cache_read_input_tokens ?? 0) + (cached.cache_creation_input_tokens ?? 0);
              break;
            }
            case "content_block_start": {
              // The installed SDK's content-block union may not include server
              // tool blocks, so read fields off a loosely-typed view.
              const block = event.content_block as {
                type: string;
                id?: string;
                name?: string;
                tool_use_id?: string;
                content?: unknown;
              };
              if (block.type === "text") {
                blockState.set(event.index, { kind: "text", jsonBuf: "" });
              } else if (block.type === "tool_use") {
                blockState.set(event.index, {
                  kind: "tool_use",
                  id: block.id,
                  name: block.name,
                  jsonBuf: "",
                });
                yield { type: "tool-use-start", id: block.id!, name: block.name! };
              } else if (block.type === "server_tool_use") {
                blockState.set(event.index, {
                  kind: "server_tool_use",
                  id: block.id,
                  name: block.name,
                  jsonBuf: "",
                });
              } else if (block.type === "web_search_tool_result") {
                yield {
                  type: "server-tool-result",
                  id: block.tool_use_id ?? "web_search",
                  name: "web_search",
                  result: block.content,
                };
              }
              break;
            }
            case "content_block_delta": {
              const s = blockState.get(event.index);
              if (!s) break;
              if (event.delta.type === "text_delta") {
                yield { type: "text-delta", delta: event.delta.text };
              } else if (event.delta.type === "input_json_delta") {
                s.jsonBuf += event.delta.partial_json;
                if (s.id) {
                  yield {
                    type: "tool-use-input-delta",
                    id: s.id,
                    delta: event.delta.partial_json,
                  };
                }
              }
              break;
            }
            case "content_block_stop": {
              const s = blockState.get(event.index);
              if (s && (s.kind === "tool_use" || s.kind === "server_tool_use") && s.id) {
                let parsed: unknown = {};
                if (s.jsonBuf.trim()) {
                  try {
                    parsed = JSON.parse(s.jsonBuf);
                  } catch {
                    parsed = { _raw: s.jsonBuf };
                  }
                }
                if (s.kind === "server_tool_use") {
                  yield { type: "server-tool-use", id: s.id, name: s.name ?? "web_search", input: parsed };
                } else {
                  yield { type: "tool-use-end", id: s.id, input: parsed };
                }
              }
              blockState.delete(event.index);
              break;
            }
            case "message_delta": {
              usage.completionTokens += event.usage?.output_tokens ?? 0;
              if (event.delta.stop_reason) stopReason = mapStopReason(event.delta.stop_reason);
              break;
            }
            case "message_stop":
              break;
          }
        }
        yield { type: "message-stop", usage, stopReason };
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        yield { type: "error", error: { message: e.message, name: e.name } };
      }
    },
  };
}
