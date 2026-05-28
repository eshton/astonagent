// Server-only: map skill names sent by the client to real Skill objects.
// Web search is provider-aware: Anthropic/OpenAI use native server-side search,
// while Ollama uses its hosted Web Search API exposed as a local tool.

import { defineSkill, webSearchSkill, type Skill } from "@astonagent/core";
import { ollamaWebSearch } from "@astonagent/providers/ollama";
import { findModel } from "./models";

function webSearchFor(modelId: string | undefined, apiKey?: string): Skill {
  const model = findModel(modelId);
  if (model?.provider === "ollama") {
    return defineSkill({
      name: "web-search",
      description: "Search the web via Ollama and cite sources.",
      instructions:
        "When the user asks about current events, recent releases, or anything that may have changed recently, call the web_search tool to find accurate, up-to-date information, then cite the sources you used.",
      tools: [ollamaWebSearch({ apiKey })],
    });
  }
  // Anthropic + OpenAI: native server-side web search.
  return webSearchSkill;
}

export function resolveSkills(
  names: unknown,
  modelId?: string,
  apiKey?: string,
): Skill[] {
  if (!Array.isArray(names)) return [];
  const out: Skill[] = [];
  for (const n of names) {
    if (String(n) === "web-search") out.push(webSearchFor(modelId, apiKey));
  }
  return out;
}
