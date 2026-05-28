// Server-only: map skill names sent by the client to real Skill objects.

import { webSearchSkill, type Skill } from "@astonagent/core";

const REGISTRY: Record<string, Skill> = {
  "web-search": webSearchSkill,
};

export function resolveSkills(names: unknown): Skill[] {
  if (!Array.isArray(names)) return [];
  const out: Skill[] = [];
  for (const n of names) {
    const skill = REGISTRY[String(n)];
    if (skill) out.push(skill);
  }
  return out;
}
