// Client-safe model registry — pure data, no SDK imports or env access.

export type ProviderId = "anthropic" | "openai" | "ollama";

export interface ModelDef {
  id: string;
  label: string;
  provider: ProviderId;
  /** Whether this model supports provider-native web search. */
  webSearch?: boolean;
}

export const MODELS: ModelDef[] = [
  { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", provider: "anthropic", webSearch: true },
  { id: "claude-opus-4-1", label: "Claude Opus 4.1", provider: "anthropic", webSearch: true },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic", webSearch: true },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", provider: "openai" },
  {
    id: "gpt-4o-search-preview",
    label: "GPT-4o Search",
    provider: "openai",
    webSearch: true,
  },
  {
    id: "gpt-4o-mini-search-preview",
    label: "GPT-4o mini Search",
    provider: "openai",
    webSearch: true,
  },
  { id: "gpt-oss:120b", label: "gpt-oss 120b (Ollama Cloud)", provider: "ollama" },
  { id: "qwen3-coder:480b", label: "Qwen3 Coder 480b (Ollama Cloud)", provider: "ollama" },
  { id: "deepseek-v3.1:671b", label: "DeepSeek v3.1 671b (Ollama Cloud)", provider: "ollama" },
];

export function findModel(id: string | undefined): ModelDef | undefined {
  return MODELS.find((m) => m.id === id);
}
