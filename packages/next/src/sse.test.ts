import { describe, expect, it } from "vitest";
import { sseEncodeEvent, sseDecode, sseStream } from "./sse.js";
import type { StreamEvent } from "@astonagent/core";

describe("sse codec", () => {
  it("encodes and decodes a roundtrip", async () => {
    const events: StreamEvent[] = [
      { type: "message-start", messageId: "m1" },
      { type: "text-delta", delta: "Hello " },
      { type: "text-delta", delta: "world" },
      {
        type: "message-stop",
        stopReason: "end_turn",
        usage: { promptTokens: 5, completionTokens: 2 },
      },
    ];

    async function* gen() {
      for (const e of events) yield e;
    }

    const stream = sseStream(gen());
    const out: StreamEvent[] = [];
    for await (const ev of sseDecode(stream)) out.push(ev);
    expect(out).toEqual(events);
  });

  it("handles unicode safely", () => {
    const ev: StreamEvent = { type: "text-delta", delta: "héllo 🎉" };
    const frame = sseEncodeEvent(ev);
    expect(frame).toMatch(/héllo 🎉/);
    expect(frame.endsWith("\n\n")).toBe(true);
  });
});
