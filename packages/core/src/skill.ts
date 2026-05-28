import type { ToolDef } from "./provider.js";
import type { ServerTool } from "./types.js";

/**
 * A composable capability: instructions appended to the system prompt plus any
 * local tools and provider-native server tools the skill needs. Enabling a
 * skill is purely additive.
 */
export interface Skill {
  name: string;
  description: string;
  /** Prose merged into the system prompt when the skill is enabled. */
  instructions?: string;
  /** Locally-executed tools the skill contributes. */
  tools?: ToolDef[];
  /** Provider-native tools (e.g. web search) the skill enables. */
  serverTools?: ServerTool[];
}

export function defineSkill(skill: Skill): Skill {
  return skill;
}

export interface ComposeSkillsInput {
  system?: string;
  tools?: ToolDef[];
  serverTools?: ServerTool[];
  skills?: Skill[];
}

export interface ComposedAgent {
  system?: string;
  tools: ToolDef[];
  serverTools: ServerTool[];
}

/**
 * Merge a set of skills into a base system prompt, tool list, and server-tool
 * list. Skill instructions are appended under a "## Skills" section. Tools are
 * de-duplicated by name and server tools by type; the base set wins on conflict.
 */
export function composeSkills(input: ComposeSkillsInput): ComposedAgent {
  const skills = input.skills ?? [];

  const tools: ToolDef[] = [...(input.tools ?? [])];
  const toolNames = new Set(tools.map((t) => t.name));

  const serverTools: ServerTool[] = [...(input.serverTools ?? [])];
  const serverToolTypes = new Set(serverTools.map((t) => t.type));

  const instructionBlocks: string[] = [];

  for (const skill of skills) {
    if (skill.instructions?.trim()) {
      instructionBlocks.push(`### ${skill.name}\n${skill.instructions.trim()}`);
    }
    for (const tool of skill.tools ?? []) {
      if (!toolNames.has(tool.name)) {
        tools.push(tool);
        toolNames.add(tool.name);
      }
    }
    for (const st of skill.serverTools ?? []) {
      if (!serverToolTypes.has(st.type)) {
        serverTools.push(st);
        serverToolTypes.add(st.type);
      }
    }
  }

  let system = input.system;
  if (instructionBlocks.length > 0) {
    const skillSection = `## Skills\nYou have the following skills enabled. Use them when relevant.\n\n${instructionBlocks.join("\n\n")}`;
    system = system ? `${system}\n\n${skillSection}` : skillSection;
  }

  return { system, tools, serverTools };
}

/**
 * Built-in skill that turns on provider-native web search. Requires a provider
 * whose `capabilities.webSearch` is true.
 */
export const webSearchSkill: Skill = defineSkill({
  name: "web-search",
  description: "Search the web for current information and cite sources.",
  instructions:
    "When the user asks about current events, recent releases, prices, or anything that may have changed since your training data, use web search to find accurate, up-to-date information. Briefly cite the sources you used.",
  serverTools: [{ type: "web_search" }],
});
