export type Role = "user" | "assistant" | "system" | "tool";

export interface TextPart {
  type: "text";
  text: string;
}

export interface ImagePart {
  type: "image";
  data: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
}

export interface ToolUsePart {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}

export interface ToolResultPart {
  type: "tool_result";
  toolUseId: string;
  output: unknown;
  isError?: boolean;
}

/** A tool the provider runs server-side (e.g. native web search). */
export interface ServerToolUsePart {
  type: "server_tool_use";
  id: string;
  name: string;
  input: unknown;
}

/** The result of a server-side tool, returned inline by the provider. */
export interface ServerToolResultPart {
  type: "server_tool_result";
  id: string;
  name: string;
  result: unknown;
}

export type ContentPart =
  | TextPart
  | ImagePart
  | ToolUsePart
  | ToolResultPart
  | ServerToolUsePart
  | ServerToolResultPart;

/** A provider-native tool that runs on the provider's servers. */
export type ServerTool = { type: "web_search"; maxUses?: number };

export interface AstonMessage {
  id: string;
  role: Role;
  content: ContentPart[];
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  cachedTokens?: number;
}

export type StopReason = "end_turn" | "tool_use" | "max_tokens" | "stop_sequence" | "error";

export type StreamEvent =
  | { type: "message-start"; messageId: string }
  | { type: "text-delta"; delta: string }
  | { type: "tool-use-start"; id: string; name: string }
  | { type: "tool-use-input-delta"; id: string; delta: string }
  | { type: "tool-use-end"; id: string; input: unknown }
  | { type: "server-tool-use"; id: string; name: string; input: unknown }
  | { type: "server-tool-result"; id: string; name: string; result: unknown }
  | { type: "message-stop"; usage: TokenUsage; stopReason: StopReason }
  | { type: "error"; error: { message: string; name?: string } };
