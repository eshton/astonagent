// Client-safe skill metadata for the demo. The actual Skill objects (with
// instructions and tools) live server-side in resolve-skills.ts.

export interface SkillMeta {
  name: string;
  label: string;
  description: string;
  /** Requires a model whose `webSearch` capability is true. */
  requiresWebSearch?: boolean;
}

export const SKILLS: SkillMeta[] = [
  {
    name: "web-search",
    label: "Web Search",
    description: "Let the model search the web and cite sources.",
    requiresWebSearch: true,
  },
];
