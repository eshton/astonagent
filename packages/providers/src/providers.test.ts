import { describe, expect, it } from "vitest";
import { anthropic } from "./anthropic.js";
import { openai } from "./openai.js";

describe("anthropic provider", () => {
  it("exposes id, modelId, and a stream() function", () => {
    const p = anthropic({ model: "claude-sonnet-4-5", apiKey: "test" });
    expect(p.id).toBe("anthropic");
    expect(p.modelId).toBe("claude-sonnet-4-5");
    expect(typeof p.stream).toBe("function");
  });
});

describe("openai provider", () => {
  it("exposes id, modelId, and a stream() function", () => {
    const p = openai({ model: "gpt-4o-mini", apiKey: "test" });
    expect(p.id).toBe("openai");
    expect(p.modelId).toBe("gpt-4o-mini");
    expect(typeof p.stream).toBe("function");
  });
});
