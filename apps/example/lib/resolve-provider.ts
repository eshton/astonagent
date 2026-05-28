// Server-only: maps a model id to a configured Provider. A per-request API key
// (sent by the browser via BYOK) takes precedence; otherwise the provider falls
// back to its environment variable.

import type { Provider } from "@astonagent/core";
import { anthropic } from "@astonagent/providers/anthropic";
import { openai } from "@astonagent/providers/openai";
import { ollama } from "@astonagent/providers/ollama";
import { MODELS, findModel, type ProviderId } from "./models";

const ENV_VAR: Record<ProviderId, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  ollama: "OLLAMA_API_KEY",
};

export function providerKeyPresent(provider: ProviderId): boolean {
  return Boolean(process.env[ENV_VAR[provider]]);
}

/** Providers that have a key configured in the server environment. */
export function configuredEnvProviders(): ProviderId[] {
  return (Object.keys(ENV_VAR) as ProviderId[]).filter(providerKeyPresent);
}

export function resolveProvider(modelId: string | undefined, apiKey?: string): Provider {
  const model = findModel(modelId) ?? MODELS[0];
  if (!model) throw new Error("No models configured");

  const key = apiKey?.trim() || undefined;
  if (!key && !providerKeyPresent(model.provider)) {
    throw new Error(
      `No API key for ${model.provider}. Add one on the Settings page, or set ${ENV_VAR[model.provider]}.`,
    );
  }

  switch (model.provider) {
    case "anthropic":
      return anthropic({ model: model.id, apiKey: key });
    case "openai":
      return openai({ model: model.id, apiKey: key });
    case "ollama":
      return ollama({ model: model.id, apiKey: key });
  }
}
