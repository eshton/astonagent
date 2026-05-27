import type { StreamEvent } from "@astonagent/core";

/**
 * Encode a single StreamEvent as an SSE frame: `data: <json>\n\n`.
 * Our wire format is intentionally simple — one JSON-encoded StreamEvent per frame.
 */
export function sseEncodeEvent(ev: StreamEvent): string {
  return `data: ${JSON.stringify(ev)}\n\n`;
}

/** Encode a heartbeat comment frame (clients ignore comments). */
export function sseHeartbeat(): string {
  return `: keep-alive\n\n`;
}

/**
 * Transform an AsyncIterable<StreamEvent> into a ReadableStream<Uint8Array>
 * suitable for returning from a route handler.
 */
export function sseStream(events: AsyncIterable<StreamEvent>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of events) {
          controller.enqueue(encoder.encode(sseEncodeEvent(ev)));
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        controller.enqueue(
          encoder.encode(
            sseEncodeEvent({
              type: "error",
              error: { message: error.message, name: error.name },
            }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * Parse a stream of SSE chunks back into StreamEvents. Used by the client hook.
 * Returns an async iterable.
 */
export async function* sseDecode(
  stream: ReadableStream<Uint8Array>,
): AsyncIterable<StreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE frames are separated by a blank line
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const dataLine = frame
          .split("\n")
          .find((l) => l.startsWith("data: "));
        if (!dataLine) continue;
        const json = dataLine.slice(6);
        try {
          yield JSON.parse(json) as StreamEvent;
        } catch {
          // skip malformed frames
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
