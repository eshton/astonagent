import type { AstonMessage } from "./types.js";

export interface Conversation {
  id: string;
  title: string | null;
  userId: string | null;
  systemPrompt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Run {
  id: string;
  conversationId: string;
  status: "streaming" | "complete" | "error" | "aborted";
  promptTokens: number | null;
  completionTokens: number | null;
  cachedTokens: number | null;
  error: string | null;
  createdAt: Date;
}

export interface CreateConversationInput {
  id?: string;
  userId?: string;
  title?: string;
  system?: string;
  metadata?: Record<string, unknown>;
}

export interface ListConversationsOptions {
  userId?: string;
  limit?: number;
  cursor?: string;
}

export interface ConversationStore {
  createConversation(input: CreateConversationInput): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | null>;
  listConversations(opts: ListConversationsOptions): Promise<Conversation[]>;
  saveMessage(msg: AstonMessage & { conversationId: string }): Promise<void>;
  listMessages(conversationId: string): Promise<AstonMessage[]>;
  startRun(input: { conversationId: string }): Promise<Run>;
  finishRun(id: string, patch: Partial<Omit<Run, "id" | "conversationId" | "createdAt">>): Promise<void>;
}
