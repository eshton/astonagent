import { newId } from "./id.js";
import type { Provider, ToolDef } from "./provider.js";
import type {
  AstonMessage,
  ContentPart,
  StopReason,
  StreamEvent,
  TokenUsage,
  ToolResultPart,
  ToolUsePart,
} from "./types.js";

export interface RunContext {
  conversationId: string;
  step: number;
  usage: TokenUsage;
}

export interface AgentHooks {
  onMessageStart?: (msg: AstonMessage, ctx: RunContext) => void | Promise<void>;
  onTextDelta?: (delta: string, ctx: RunContext) => void | Promise<void>;
  onMessageComplete?: (msg: AstonMessage, ctx: RunContext) => void | Promise<void>;
  onToolCall?: (call: ToolUsePart, ctx: RunContext) => void | Promise<void>;
  onToolResult?: (result: ToolResultPart, ctx: RunContext) => void | Promise<void>;
  onStep?: (step: number, ctx: RunContext) => void | Promise<void>;
  onError?: (err: Error, ctx: RunContext) => void | Promise<void>;
}

export interface RunOptions {
  conversationId: string;
  provider: Provider;
  messages: AstonMessage[];
  system?: string;
  tools?: ToolDef[];
  maxSteps?: number;
  hooks?: AgentHooks;
  abortSignal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
}

const EMPTY_USAGE: TokenUsage = { promptTokens: 0, completionTokens: 0, cachedTokens: 0 };

export async function* runAgent(opts: RunOptions): AsyncIterable<StreamEvent> {
  const maxSteps = opts.maxSteps ?? 8;
  const hooks = opts.hooks ?? {};
  const workingMessages: AstonMessage[] = [...opts.messages];
  const totalUsage: TokenUsage = { ...EMPTY_USAGE };

  for (let step = 0; step < maxSteps; step++) {
    const ctx: RunContext = { conversationId: opts.conversationId, step, usage: totalUsage };
    await hooks.onStep?.(step, ctx);

    const assistantMsg: AstonMessage = {
      id: newId("msg"),
      role: "assistant",
      content: [],
      createdAt: new Date(),
    };
    await hooks.onMessageStart?.(assistantMsg, ctx);
    yield { type: "message-start", messageId: assistantMsg.id };

    const toolInputBuffers = new Map<string, { name: string; buffer: string }>();
    let pendingText = "";
    let stopReason: StopReason | null = null;

    try {
      for await (const ev of opts.provider.stream({
        messages: workingMessages,
        system: opts.system,
        tools: opts.tools,
        temperature: opts.temperature,
        maxTokens: opts.maxTokens,
        abortSignal: opts.abortSignal,
      })) {
        switch (ev.type) {
          case "text-delta":
            pendingText += ev.delta;
            await hooks.onTextDelta?.(ev.delta, ctx);
            break;
          case "tool-use-start":
            if (pendingText) {
              assistantMsg.content.push({ type: "text", text: pendingText });
              pendingText = "";
            }
            toolInputBuffers.set(ev.id, { name: ev.name, buffer: "" });
            break;
          case "tool-use-input-delta": {
            const buf = toolInputBuffers.get(ev.id);
            if (buf) buf.buffer += ev.delta;
            break;
          }
          case "tool-use-end": {
            const buf = toolInputBuffers.get(ev.id);
            const name = buf?.name ?? "unknown";
            const toolUse: ToolUsePart = {
              type: "tool_use",
              id: ev.id,
              name,
              input: ev.input,
            };
            assistantMsg.content.push(toolUse);
            toolInputBuffers.delete(ev.id);
            await hooks.onToolCall?.(toolUse, ctx);
            break;
          }
          case "message-stop":
            totalUsage.promptTokens += ev.usage.promptTokens;
            totalUsage.completionTokens += ev.usage.completionTokens;
            if (ev.usage.cachedTokens) {
              totalUsage.cachedTokens = (totalUsage.cachedTokens ?? 0) + ev.usage.cachedTokens;
            }
            stopReason = ev.stopReason;
            break;
          case "error": {
            const err = new Error(ev.error.message);
            if (ev.error.name) err.name = ev.error.name;
            await hooks.onError?.(err, ctx);
            throw err;
          }
        }
        yield ev;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      await hooks.onError?.(error, ctx);
      yield { type: "error", error: { message: error.message, name: error.name } };
      return;
    }

    if (pendingText) {
      assistantMsg.content.push({ type: "text", text: pendingText });
    }
    await hooks.onMessageComplete?.(assistantMsg, ctx);
    workingMessages.push(assistantMsg);

    if (stopReason !== "tool_use") return;

    const toolCalls = assistantMsg.content.filter(
      (p): p is ToolUsePart => p.type === "tool_use",
    );
    if (toolCalls.length === 0) return;

    const toolResults = await executeTools(toolCalls, opts.tools ?? [], {
      conversationId: opts.conversationId,
      abortSignal: opts.abortSignal,
    });

    const toolMsg: AstonMessage = {
      id: newId("msg"),
      role: "tool",
      content: toolResults,
      createdAt: new Date(),
    };
    for (const r of toolResults) await hooks.onToolResult?.(r, ctx);
    await hooks.onMessageComplete?.(toolMsg, ctx);
    workingMessages.push(toolMsg);
  }
}

async function executeTools(
  calls: ToolUsePart[],
  tools: ToolDef[],
  ctx: { conversationId: string; abortSignal?: AbortSignal },
): Promise<ToolResultPart[]> {
  const toolMap = new Map(tools.map((t) => [t.name, t]));
  const out: ToolResultPart[] = [];
  for (const call of calls) {
    const tool = toolMap.get(call.name);
    if (!tool) {
      out.push({
        type: "tool_result",
        toolUseId: call.id,
        output: { error: `Unknown tool: ${call.name}` },
        isError: true,
      });
      continue;
    }
    try {
      const parsed = tool.inputSchema.parse(call.input);
      const result = await tool.execute(parsed, {
        conversationId: ctx.conversationId,
        toolUseId: call.id,
        abortSignal: ctx.abortSignal,
      });
      out.push({ type: "tool_result", toolUseId: call.id, output: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      out.push({
        type: "tool_result",
        toolUseId: call.id,
        output: { error: message },
        isError: true,
      });
    }
  }
  return out;
}

// Convenience: count what content parts a message has, for the UI to render incremental state
export function partsOf(msg: AstonMessage): ContentPart[] {
  return msg.content;
}
