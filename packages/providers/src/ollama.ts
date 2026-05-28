import type { Provider } from "@astonagent/core";
import { openai } from "./openai.js";

export interface OllamaProviderOptions {
  /** Ollama API key. Defaults to process.env.OLLAMA_API_KEY. Required for cloud. */
  apiKey?: string;
  /** Model name, e.g. "gpt-oss:120b" (cloud) or "llama3.2" (local). */
  model: string;
  /**
   * OpenAI-compatible base URL. Defaults to Ollama Cloud
   * ("https://ollama.com/v1"). For a local daemon, pass
   * "http://localhost:11434/v1".
   */
  baseURL?: string;
}

const CLOUD_BASE_URL = "https://ollama.com/v1";

/**
 * Ollama provider (cloud or local). Ollama exposes an OpenAI-compatible
 * `/v1/chat/completions` endpoint with tool-calling and streaming, so this
 * delegates to the OpenAI adapter with Ollama's base URL and key. Reports its
 * id as "ollama" so the rest of the stack can distinguish it.
 */
export function ollama(opts: OllamaProviderOptions): Provider {
  const base = openai({
    model: opts.model,
    // Fall back to a dummy key so a local daemon (which ignores auth) works
    // without configuration. Cloud requests with a bad key fail at stream time.
    apiKey: opts.apiKey ?? process.env.OLLAMA_API_KEY ?? "ollama",
    baseURL: opts.baseURL ?? CLOUD_BASE_URL,
  });
  return { ...base, id: "ollama" };
}
