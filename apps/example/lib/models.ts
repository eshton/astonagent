// Client-safe model registry — pure data, no SDK imports or env access.

export type ProviderId = "anthropic" | "openai";

export interface ModelDef {
  id: string;
  label: string;
  provider: ProviderId;
}

export const MODELS: ModelDef[] = [
  { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", provider: "anthropic" },
  { id: "claude-opus-4-1", label: "Claude Opus 4.1", provider: "anthropic" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", provider: "openai" },
];

export function findModel(id: string | undefined): ModelDef | undefined {
  return MODELS.find((m) => m.id === id);
}
