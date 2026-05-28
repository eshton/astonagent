import OpenAI from "openai";
import type {
  AstonMessage,
  ContentPart,
  GenerateRequest,
  Provider,
  StopReason,
  StreamEvent,
  ToolDef,
} from "@astonagent/core";
import { toolToJsonSchema } from "./tool-schema.js";

export interface OpenAIProviderOptions {
  apiKey?: string;
  model: string;
  baseURL?: string;
  client?: OpenAI;
  maxTokens?: number;
}

type OAIMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

function partsToOpenAIContent(
  parts: ContentPart[],
): string | Array<OpenAI.Chat.Completions.ChatCompletionContentPart> {
  // Pure text fast path
  if (parts.every((p) => p.type === "text")) {
    return parts.map((p) => (p as { text: string }).text).join("");
  }
  const out: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
  for (const p of parts) {
    if (p.type === "text") out.push({ type: "text", text: p.text });
    else if (p.type === "image")
      out.push({
        type: "image_url",
        image_url: { url: `data:${p.mediaType};base64,${p.data}` },
      });
    // tool_use/tool_result handled at message level
  }
  return out;
}

function toOpenAIMessages(messages: AstonMessage[], system?: string): OAIMessage[] {
  const out: OAIMessage[] = [];
  if (system) out.push({ role: "system", content: system });

  for (const m of messages) {
    if (m.role === "system") {
      out.push({ role: "system", content: m.content.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("") });
      continue;
    }
    if (m.role === "tool") {
      for (const p of m.content) {
        if (p.type !== "tool_result") continue;
        out.push({
          role: "tool",
          tool_call_id: p.toolUseId,
          content: typeof p.output === "string" ? p.output : JSON.stringify(p.output),
        });
      }
      continue;
    }
    if (m.role === "assistant") {
      const toolUses = m.content.filter((p): p is Extract<ContentPart, { type: "tool_use" }> => p.type === "tool_use");
      const textParts = m.content.filter((p) => p.type === "text" || p.type === "image");
      const msg: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam = {
        role: "assistant",
        content: textParts.length > 0 ? (partsToOpenAIContent(textParts) as string) : null,
      };
      if (toolUses.length > 0) {
        msg.tool_calls = toolUses.map((t) => ({
          id: t.id,
          type: "function",
          function: { name: t.name, arguments: JSON.stringify(t.input ?? {}) },
        }));
      }
      out.push(msg);
      continue;
    }
    // user
    out.push({ role: "user", content: partsToOpenAIContent(m.content) });
  }
  return out;
}

function buildTools(tools?: ToolDef[]): OpenAI.Chat.Completions.ChatCompletionTool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: toolToJsonSchema(t),
    },
  }));
}

function mapFinishReason(reason: string | null | undefined): StopReason {
  switch (reason) {
    case "stop":
      return "end_turn";
    case "tool_calls":
    case "function_call":
      return "tool_use";
    case "length":
      return "max_tokens";
    case "content_filter":
      return "error";
    default:
      return "end_turn";
  }
}

interface ToolCallAccum {
  index: number;
  id: string;
  name: string;
  argsBuf: string;
  emittedStart: boolean;
}

export function openai(opts: OpenAIProviderOptions): Provider {
  // Construct the SDK client lazily so a missing API key only errors when this
  // provider is actually used to stream — not at import time.
  let client: OpenAI | undefined = opts.client;
  const getClient = (): OpenAI => {
    if (!client) {
      client = new OpenAI({
        apiKey: opts.apiKey ?? process.env.OPENAI_API_KEY,
        baseURL: opts.baseURL,
      });
    }
    return client;
  };
  const modelId = opts.model;

  return {
    id: "openai",
    modelId,
    capabilities: { webSearch: true },
    async *stream(req: GenerateRequest): AsyncIterable<StreamEvent> {
      const messages = toOpenAIMessages(req.messages, req.system);
      const tools = buildTools(req.tools);
      const wantsWebSearch = (req.serverTools ?? []).some((t) => t.type === "web_search");
      try {
        const params: Record<string, unknown> = {
          model: modelId,
          messages,
          stream: true,
          stream_options: { include_usage: true },
          tools,
          temperature: req.temperature,
          max_tokens: req.maxTokens ?? opts.maxTokens,
        };
        // OpenAI runs web search server-side via web_search_options on
        // search-capable models (e.g. gpt-4o-search-preview).
        if (wantsWebSearch) params.web_search_options = {};

        const stream = await getClient().chat.completions.create(
          params as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
          { signal: req.abortSignal },
        );

        const toolAccum = new Map<number, ToolCallAccum>();
        const citations = new Map<string, { url: string; title?: string }>();
        let stopReason: StopReason = "end_turn";
        let usage = { promptTokens: 0, completionTokens: 0, cachedTokens: 0 };

        for await (const chunk of stream) {
          if (chunk.usage) {
            usage.promptTokens = chunk.usage.prompt_tokens;
            usage.completionTokens = chunk.usage.completion_tokens;
            const cached = (chunk.usage as unknown as { prompt_tokens_details?: { cached_tokens?: number } }).prompt_tokens_details?.cached_tokens;
            if (cached) usage.cachedTokens = cached;
          }
          const choice = chunk.choices[0];
          if (!choice) continue;

          const delta = choice.delta;
          if (delta?.content) {
            yield { type: "text-delta", delta: delta.content };
          }
          // Web-search citations arrive as annotations on the delta.
          const annotations = (delta as unknown as {
            annotations?: Array<{ type: string; url_citation?: { url: string; title?: string } }>;
          }).annotations;
          if (annotations) {
            for (const a of annotations) {
              if (a.type === "url_citation" && a.url_citation?.url) {
                citations.set(a.url_citation.url, {
                  url: a.url_citation.url,
                  title: a.url_citation.title,
                });
              }
            }
          }
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const index = tc.index;
              let acc = toolAccum.get(index);
              if (!acc) {
                acc = {
                  index,
                  id: tc.id ?? "",
                  name: tc.function?.name ?? "",
                  argsBuf: "",
                  emittedStart: false,
                };
                toolAccum.set(index, acc);
              }
              if (tc.id) acc.id = tc.id;
              if (tc.function?.name) acc.name = tc.function.name;
              if (!acc.emittedStart && acc.id && acc.name) {
                acc.emittedStart = true;
                yield { type: "tool-use-start", id: acc.id, name: acc.name };
              }
              if (tc.function?.arguments) {
                acc.argsBuf += tc.function.arguments;
                if (acc.emittedStart) {
                  yield {
                    type: "tool-use-input-delta",
                    id: acc.id,
                    delta: tc.function.arguments,
                  };
                }
              }
            }
          }
          if (choice.finish_reason) {
            stopReason = mapFinishReason(choice.finish_reason);
          }
        }

        // Emit tool-use-end for any tool calls we accumulated
        for (const acc of toolAccum.values()) {
          let parsed: unknown = {};
          if (acc.argsBuf.trim()) {
            try {
              parsed = JSON.parse(acc.argsBuf);
            } catch {
              parsed = { _raw: acc.argsBuf };
            }
          }
          yield { type: "tool-use-end", id: acc.id, input: parsed };
        }

        // Surface web-search citations as a server-tool result so the UI can
        // show sources, mirroring the Anthropic shape.
        if (citations.size > 0) {
          const id = "web_search_openai";
          yield { type: "server-tool-use", id, name: "web_search", input: {} };
          yield {
            type: "server-tool-result",
            id,
            name: "web_search",
            result: [...citations.values()].map((c) => ({ url: c.url, title: c.title })),
          };
        }

        yield { type: "message-stop", usage, stopReason };
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        yield { type: "error", error: { message: e.message, name: e.name } };
      }
    },
  };
}
