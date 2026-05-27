import type { z } from "zod";
import type { AstonMessage, StreamEvent } from "./types.js";

export interface ToolContext {
  conversationId: string;
  toolUseId: string;
  abortSignal?: AbortSignal;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ToolDef<TIn = any, TOut = any> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TIn>;
  execute: (input: TIn, ctx: ToolContext) => Promise<TOut> | TOut;
}

export interface GenerateRequest {
  messages: AstonMessage[];
  system?: string;
  tools?: ToolDef[];
  temperature?: number;
  maxTokens?: number;
  abortSignal?: AbortSignal;
}

export interface Provider {
  readonly id: string;
  readonly modelId: string;
  stream(req: GenerateRequest): AsyncIterable<StreamEvent>;
}

export function defineTool<TIn, TOut>(tool: ToolDef<TIn, TOut>): ToolDef<TIn, TOut> {
  return tool;
}
