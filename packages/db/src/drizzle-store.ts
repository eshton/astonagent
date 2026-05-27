import { newId, type AstonMessage, type ContentPart, type ConversationStore } from "@astonagent/core";
import { desc, eq } from "drizzle-orm";
import * as sqliteSchema from "./schema/sqlite.js";
import * as pgSchema from "./schema/pg.js";

type AnySchema = typeof sqliteSchema | typeof pgSchema;

export interface DrizzleStoreOptions {
  /**
   * Pass the schema you used to create the Drizzle instance. Defaults to the
   * sqlite schema. Use `pgSchema` from `@astonagent/db/schema/pg` for Postgres.
   */
  schema?: AnySchema;
}

/**
 * Create a ConversationStore backed by Drizzle. Pass your Drizzle instance and
 * the matching schema. Works with both better-sqlite3 and postgres-js drivers
 * because the query surface (insert/select/where/orderBy) is dialect-agnostic
 * for the operations astonagent uses.
 */
export function drizzleStore(
  db: any,
  { schema = sqliteSchema as AnySchema }: DrizzleStoreOptions = {},
): ConversationStore {
  const { conversations, messages, runs } = schema as typeof sqliteSchema;

  const asDate = (v: unknown): Date => (v instanceof Date ? v : new Date(v as number));

  return {
    async createConversation(input) {
      const id = input.id ?? newId("conv");
      const now = new Date();
      const row = {
        id,
        title: input.title ?? null,
        userId: input.userId ?? null,
        systemPrompt: input.system ?? null,
        metadata: input.metadata ?? null,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(conversations).values(row);
      return {
        id,
        title: row.title,
        userId: row.userId,
        systemPrompt: row.systemPrompt,
        metadata: row.metadata,
        createdAt: now,
        updatedAt: now,
      };
    },

    async getConversation(id) {
      const rows = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
      const r = rows[0];
      if (!r) return null;
      return {
        id: r.id,
        title: r.title,
        userId: r.userId,
        systemPrompt: r.systemPrompt,
        metadata: r.metadata,
        createdAt: asDate(r.createdAt),
        updatedAt: asDate(r.updatedAt),
      };
    },

    async listConversations(opts) {
      const limit = opts.limit ?? 50;
      let query = db.select().from(conversations);
      if (opts.userId) {
        query = query.where(eq(conversations.userId, opts.userId));
      }
      const rows = await query.orderBy(desc(conversations.updatedAt)).limit(limit);
      return rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        userId: r.userId,
        systemPrompt: r.systemPrompt,
        metadata: r.metadata,
        createdAt: asDate(r.createdAt),
        updatedAt: asDate(r.updatedAt),
      }));
    },

    async saveMessage(msg) {
      await db.insert(messages).values({
        id: msg.id,
        conversationId: msg.conversationId,
        role: msg.role,
        content: msg.content as unknown as ContentPart[],
        metadata: msg.metadata ?? null,
        createdAt: msg.createdAt,
      });
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, msg.conversationId));
    },

    async listMessages(conversationId) {
      const rows = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
      return rows.map((r: any): AstonMessage => ({
        id: r.id,
        role: r.role,
        content: r.content as ContentPart[],
        createdAt: asDate(r.createdAt),
        metadata: r.metadata ?? undefined,
      }));
    },

    async startRun(input) {
      const id = newId("run");
      const now = new Date();
      await db.insert(runs).values({
        id,
        conversationId: input.conversationId,
        status: "streaming",
        promptTokens: null,
        completionTokens: null,
        cachedTokens: null,
        error: null,
        createdAt: now,
      });
      return {
        id,
        conversationId: input.conversationId,
        status: "streaming",
        promptTokens: null,
        completionTokens: null,
        cachedTokens: null,
        error: null,
        createdAt: now,
      };
    },

    async finishRun(id, patch) {
      const set: Record<string, unknown> = {};
      if (patch.status !== undefined) set.status = patch.status;
      if (patch.promptTokens !== undefined) set.promptTokens = patch.promptTokens;
      if (patch.completionTokens !== undefined) set.completionTokens = patch.completionTokens;
      if (patch.cachedTokens !== undefined) set.cachedTokens = patch.cachedTokens;
      if (patch.error !== undefined) set.error = patch.error;
      if (Object.keys(set).length === 0) return;
      await db.update(runs).set(set).where(eq(runs.id, id));
    },
  };
}

