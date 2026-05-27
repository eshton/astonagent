import type { ToolDef } from "@astonagent/core";
import { zodToJsonSchema } from "zod-to-json-schema";

export function toolToJsonSchema(tool: ToolDef): Record<string, unknown> {
  const schema = zodToJsonSchema(tool.inputSchema, { target: "openApi3" }) as Record<string, unknown>;
  // Strip the $schema field — both Anthropic and OpenAI dislike it
  delete (schema as { $schema?: unknown }).$schema;
  return schema;
}
