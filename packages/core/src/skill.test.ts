import { describe, expect, it } from "vitest";
import { z } from "zod";
import { composeSkills, defineSkill, webSearchSkill } from "./skill.js";
import { defineTool } from "./provider.js";

describe("composeSkills", () => {
  it("merges instructions into the system prompt", () => {
    const skill = defineSkill({
      name: "pirate",
      description: "Talk like a pirate",
      instructions: "Always respond in pirate slang.",
    });
    const out = composeSkills({ system: "Be helpful.", skills: [skill] });
    expect(out.system).toContain("Be helpful.");
    expect(out.system).toContain("## Skills");
    expect(out.system).toContain("pirate slang");
  });

  it("concatenates tools and dedups by name", () => {
    const a = defineTool({
      name: "shared",
      description: "",
      inputSchema: z.object({}),
      execute: () => 1,
    });
    const b = defineTool({
      name: "shared",
      description: "",
      inputSchema: z.object({}),
      execute: () => 2,
    });
    const out = composeSkills({
      tools: [a],
      skills: [defineSkill({ name: "s", description: "", tools: [b] })],
    });
    expect(out.tools).toHaveLength(1);
    expect(out.tools[0]).toBe(a); // base wins on conflict
  });

  it("collects server tools and dedups by type", () => {
    const out = composeSkills({ skills: [webSearchSkill, webSearchSkill] });
    expect(out.serverTools).toEqual([{ type: "web_search" }]);
  });

  it("returns base system unchanged when no skills carry instructions", () => {
    const out = composeSkills({ system: "Base.", skills: [] });
    expect(out.system).toBe("Base.");
    expect(out.tools).toEqual([]);
    expect(out.serverTools).toEqual([]);
  });
});
