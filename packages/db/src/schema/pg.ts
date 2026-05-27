import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const conversations = pgTable("aston_conversations", {
  id: text("id").primaryKey(),
  title: text("title"),
  userId: text("user_id"),
  systemPrompt: text("system_prompt"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const messages = pgTable("aston_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system", "tool"] }).notNull(),
  content: jsonb("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const runs = pgTable("aston_runs", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["streaming", "complete", "error", "aborted"] }).notNull(),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  cachedTokens: integer("cached_tokens"),
  error: text("error"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const astonSchema = { conversations, messages, runs };
