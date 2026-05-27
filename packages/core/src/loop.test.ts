import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { runAgent } from "./loop.js";
import type { Provider } from "./provider.js";
import { defineTool } from "./provider.js";
import type { AstonMessage, StreamEvent } from "./types.js";

function fakeProvider(scripts: StreamEvent[][]): Provider {
  let call = 0;
  return {
    id: "fake",
    modelId: "fake-1",
    async *stream() {
      const events = scripts[call] ?? [];
      call++;
      for (const ev of events) yield ev;
    },
  };
}

const userMsg = (text: string): AstonMessage => ({
  id: "u1",
  role: "user",
  content: [{ type: "text", text }],
  createdAt: new Date(),
});

describe("runAgent", () => {
  it("streams text and emits message-complete once", async () => {
    const provider = fakeProvider([
      [
        { type: "text-delta", delta: "Hello " },
        { type: "text-delta", delta: "world" },
        {
          type: "message-stop",
          stopReason: "end_turn",
          usage: { promptTokens: 1, completionTokens: 2 },
        },
      ],
    ]);
    const onComplete = vi.fn();
    const onDelta = vi.fn();
    const events: StreamEvent[] = [];
    for await (const ev of runAgent({
      conversationId: "c1",
      provider,
      messages: [userMsg("hi")],
      hooks: { onMessageComplete: onComplete, onTextDelta: onDelta },
    })) {
      events.push(ev);
    }

    expect(onDelta).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenCalledTimes(1);
    const completedMsg = onComplete.mock.calls[0]![0] as AstonMessage;
    expect(completedMsg.content).toEqual([{ type: "text", text: "Hello world" }]);
    expect(events.some((e) => e.type === "message-start")).toBe(true);
  });

  it("runs tools and loops until end_turn", async () => {
    const provider = fakeProvider([
      [
        { type: "tool-use-start", id: "t1", name: "echo" },
        { type: "tool-use-end", id: "t1", input: { text: "hi" } },
        {
          type: "message-stop",
          stopReason: "tool_use",
          usage: { promptTokens: 1, completionTokens: 1 },
        },
      ],
      [
        { type: "text-delta", delta: "done" },
        {
          type: "message-stop",
          stopReason: "end_turn",
          usage: { promptTokens: 2, completionTokens: 1 },
        },
      ],
    ]);
    const echo = defineTool({
      name: "echo",
      description: "Echoes input",
      inputSchema: z.object({ text: z.string() }),
      execute: (input) => ({ echoed: input.text }),
    });
    const onToolResult = vi.fn();
    const events: StreamEvent[] = [];
    for await (const ev of runAgent({
      conversationId: "c1",
      provider,
      messages: [userMsg("call echo")],
      tools: [echo],
      hooks: { onToolResult },
    })) {
      events.push(ev);
    }
    expect(onToolResult).toHaveBeenCalledTimes(1);
    const result = onToolResult.mock.calls[0]![0];
    expect(result.output).toEqual({ echoed: "hi" });
  });

  it("stops at maxSteps", async () => {
    const provider: Provider = {
      id: "fake",
      modelId: "fake-1",
      async *stream() {
        yield { type: "tool-use-start", id: "t" + Math.random(), name: "noop" };
        yield {
          type: "tool-use-end",
          id: "t",
          input: {},
        } as StreamEvent;
        yield {
          type: "message-stop",
          stopReason: "tool_use",
          usage: { promptTokens: 0, completionTokens: 0 },
        };
      },
    };
    const noop = defineTool({
      name: "noop",
      description: "no-op",
      inputSchema: z.object({}).passthrough(),
      execute: () => ({}),
    });
    let steps = 0;
    for await (const _ev of runAgent({
      conversationId: "c1",
      provider,
      messages: [userMsg("loop")],
      tools: [noop],
      maxSteps: 3,
      hooks: { onStep: () => void steps++ },
    })) {
      // drain
    }
    expect(steps).toBe(3);
  });

  it("yields error event when provider throws", async () => {
    const provider: Provider = {
      id: "fake",
      modelId: "fake-1",
      async *stream() {
        yield { type: "text-delta", delta: "starting" };
        throw new Error("boom");
      },
    };
    const onError = vi.fn();
    const events: StreamEvent[] = [];
    for await (const ev of runAgent({
      conversationId: "c1",
      provider,
      messages: [userMsg("err")],
      hooks: { onError },
    })) {
      events.push(ev);
    }
    expect(onError).toHaveBeenCalledOnce();
    expect(events.at(-1)).toEqual({
      type: "error",
      error: { message: "boom", name: "Error" },
    });
  });
});
