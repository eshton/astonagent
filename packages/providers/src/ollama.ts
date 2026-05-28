import { defineTool, type Provider, type ToolDef } from "@astonagent/core";
import { z } from "zod";
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
  // The provider has no in-completion server-side search; web search is exposed
  // separately as the ollamaWebSearch tool below.
  return { ...base, id: "ollama", capabilities: { webSearch: false } };
}

export interface OllamaWebSearchOptions {
  /** Ollama API key. Defaults to process.env.OLLAMA_API_KEY. */
  apiKey?: string;
  /** Max results to return (default 5). */
  maxResults?: number;
  /** Override the search endpoint. Defaults to Ollama Cloud. */
  endpoint?: string;
}

interface OllamaSearchResult {
  title: string;
  url: string;
  content: string;
}

const SEARCH_ENDPOINT = "https://ollama.com/api/web_search";

/**
 * A web-search tool backed by Ollama's hosted Web Search API. Unlike the
 * provider-native web search of Anthropic/OpenAI, this is a standalone REST
 * endpoint exposed to the model as a regular (locally-executed) tool, so it
 * works with any provider's model — it just needs an Ollama API key.
 */
export function ollamaWebSearch(opts: OllamaWebSearchOptions = {}): ToolDef {
  const endpoint = opts.endpoint ?? SEARCH_ENDPOINT;
  const maxResults = opts.maxResults ?? 5;
  return defineTool({
    name: "web_search",
    description:
      "Search the web for current information. Returns a list of results with title, url, and a content snippet. Cite the sources you use.",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
    }),
    execute: async ({ query }: { query: string }, ctx) => {
      const apiKey = opts.apiKey ?? process.env.OLLAMA_API_KEY;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ query, max_results: maxResults }),
        signal: ctx.abortSignal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Ollama web search failed: ${res.status} ${text}`.trim());
      }
      const data = (await res.json()) as { results?: OllamaSearchResult[] };
      return data.results ?? [];
    },
  });
}
