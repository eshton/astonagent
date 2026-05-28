import { describe, expect, it } from "vitest";
import { anthropic } from "./anthropic.js";
import { openai } from "./openai.js";
import { ollama } from "./ollama.js";

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

describe("ollama provider", () => {
  it("reports id 'ollama' and preserves the model id", () => {
    const p = ollama({ model: "gpt-oss:120b", apiKey: "test" });
    expect(p.id).toBe("ollama");
    expect(p.modelId).toBe("gpt-oss:120b");
    expect(typeof p.stream).toBe("function");
  });

  it("constructs without an API key (defaults for local use)", () => {
    expect(() => ollama({ model: "llama3.2", baseURL: "http://localhost:11434/v1" })).not.toThrow();
  });
});
