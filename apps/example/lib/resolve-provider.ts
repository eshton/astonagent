// Server-only: maps a model id to a configured Provider, and reports which
// models are actually usable based on the API keys present in the environment.

import type { Provider } from "@astonagent/core";
import { anthropic } from "@astonagent/providers/anthropic";
import { openai } from "@astonagent/providers/openai";
import { MODELS, findModel, type ModelDef, type ProviderId } from "./models";

export function providerKeyPresent(provider: ProviderId): boolean {
  return provider === "anthropic"
    ? Boolean(process.env.ANTHROPIC_API_KEY)
    : Boolean(process.env.OPENAI_API_KEY);
}

export function availableModels(): ModelDef[] {
  return MODELS.filter((m) => providerKeyPresent(m.provider));
}

export function resolveProvider(modelId: string | undefined): Provider {
  const model = findModel(modelId) ?? availableModels()[0] ?? MODELS[0];
  if (!model) throw new Error("No models configured");
  if (!providerKeyPresent(model.provider)) {
    const envVar = model.provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
    throw new Error(`Missing ${envVar} — cannot use model "${model.id}".`);
  }
  return model.provider === "anthropic"
    ? anthropic({ model: model.id })
    : openai({ model: model.id });
}
