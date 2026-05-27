import { newId, type AstonMessage, type ConversationStore, type Conversation, type Run } from "@astonagent/core";

export function memoryStore(): ConversationStore {
  const convs = new Map<string, Conversation>();
  const msgs = new Map<string, (AstonMessage & { conversationId: string })[]>();
  const runs = new Map<string, Run>();

  return {
    async createConversation(input) {
      const id = input.id ?? newId("conv");
      const now = new Date();
      const conv: Conversation = {
        id,
        title: input.title ?? null,
        userId: input.userId ?? null,
        systemPrompt: input.system ?? null,
        metadata: input.metadata ?? null,
        createdAt: now,
        updatedAt: now,
      };
      convs.set(id, conv);
      msgs.set(id, []);
      return conv;
    },
    async getConversation(id) {
      return convs.get(id) ?? null;
    },
    async listConversations(opts) {
      let all = [...convs.values()];
      if (opts.userId) all = all.filter((c) => c.userId === opts.userId);
      all.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      return all.slice(0, opts.limit ?? 50);
    },
    async saveMessage(msg) {
      const list = msgs.get(msg.conversationId) ?? [];
      list.push(msg);
      msgs.set(msg.conversationId, list);
      const conv = convs.get(msg.conversationId);
      if (conv) convs.set(msg.conversationId, { ...conv, updatedAt: new Date() });
    },
    async listMessages(conversationId) {
      return (msgs.get(conversationId) ?? []).map(({ conversationId: _c, ...m }) => m);
    },
    async startRun(input) {
      const id = newId("run");
      const run: Run = {
        id,
        conversationId: input.conversationId,
        status: "streaming",
        promptTokens: null,
        completionTokens: null,
        cachedTokens: null,
        error: null,
        createdAt: new Date(),
      };
      runs.set(id, run);
      return run;
    },
    async finishRun(id, patch) {
      const existing = runs.get(id);
      if (!existing) return;
      runs.set(id, { ...existing, ...patch });
    },
  };
}
