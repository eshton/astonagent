import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzleStore } from "./drizzle-store.js";
import { memoryStore } from "./memory-store.js";
import { astonSchema } from "./schema/sqlite.js";
import type { ConversationStore } from "@astonagent/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const initSql = readFileSync(join(__dirname, "..", "migrations", "sqlite", "0000_init.sql"), "utf8");

function makeSqliteStore(): ConversationStore {
  const sqlite = new Database(":memory:");
  sqlite.exec(initSql);
  const db = drizzle(sqlite, { schema: astonSchema });
  return drizzleStore(db);
}

const cases: [string, () => ConversationStore][] = [
  ["memoryStore", () => memoryStore()],
  ["drizzleStore(sqlite)", () => makeSqliteStore()],
];

for (const [name, factory] of cases) {
  describe(name, () => {
    let store: ConversationStore;
    beforeEach(() => {
      store = factory();
    });

    it("creates a conversation and retrieves it", async () => {
      const conv = await store.createConversation({ title: "Hello", userId: "u1", system: "be brief" });
      const fetched = await store.getConversation(conv.id);
      expect(fetched?.title).toBe("Hello");
      expect(fetched?.userId).toBe("u1");
      expect(fetched?.systemPrompt).toBe("be brief");
    });

    it("appends and lists messages in order", async () => {
      const conv = await store.createConversation({});
      await store.saveMessage({
        id: "m1",
        conversationId: conv.id,
        role: "user",
        content: [{ type: "text", text: "hi" }],
        createdAt: new Date(2026, 0, 1),
      });
      await store.saveMessage({
        id: "m2",
        conversationId: conv.id,
        role: "assistant",
        content: [{ type: "text", text: "hello" }],
        createdAt: new Date(2026, 0, 2),
      });
      const msgs = await store.listMessages(conv.id);
      expect(msgs.map((m) => m.id)).toEqual(["m1", "m2"]);
      expect(msgs[1]!.content).toEqual([{ type: "text", text: "hello" }]);
    });

    it("starts and finishes a run with usage", async () => {
      const conv = await store.createConversation({});
      const run = await store.startRun({ conversationId: conv.id });
      expect(run.status).toBe("streaming");
      await store.finishRun(run.id, { status: "complete", promptTokens: 10, completionTokens: 20 });
    });

    it("lists conversations newest-first", async () => {
      const a = await store.createConversation({ title: "A" });
      await new Promise((r) => setTimeout(r, 5));
      const b = await store.createConversation({ title: "B" });
      const list = await store.listConversations({});
      expect(list.map((c) => c.id)).toEqual([b.id, a.id]);
    });
  });
}
