// Server-only: maps a model id to a configured Provider, and reports which
// models are actually usable based on the API keys present in the environment.

import type { Provider } from "@astonagent/core";
import { anthropic } from "@astonagent/providers/anthropic";
import { openai } from "@astonagent/providers/openai";
import { ollama } from "@astonagent/providers/ollama";
import { MODELS, findModel, type ModelDef, type ProviderId } from "./models";

const ENV_VAR: Record<ProviderId, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  ollama: "OLLAMA_API_KEY",
};

export function providerKeyPresent(provider: ProviderId): boolean {
  return Boolean(process.env[ENV_VAR[provider]]);
}

export function availableModels(): ModelDef[] {
  return MODELS.filter((m) => providerKeyPresent(m.provider));
}

export function resolveProvider(modelId: string | undefined): Provider {
  const model = findModel(modelId) ?? availableModels()[0] ?? MODELS[0];
  if (!model) throw new Error("No models configured");
  if (!providerKeyPresent(model.provider)) {
    throw new Error(`Missing ${ENV_VAR[model.provider]} — cannot use model "${model.id}".`);
  }
  switch (model.provider) {
    case "anthropic":
      return anthropic({ model: model.id });
    case "openai":
      return openai({ model: model.id });
    case "ollama":
      return ollama({ model: model.id });
  }
}
