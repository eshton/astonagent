import {
  newId,
  runAgent,
  type AgentHooks,
  type AstonMessage,
  type ConversationStore,
  type Provider,
  type StreamEvent,
  type ToolDef,
} from "@astonagent/core";
import { sseStream } from "./sse.js";

export interface ChatRouteAuthContext {
  request: Request;
}

export interface ProviderResolverContext {
  request: Request;
  body: ChatRoutePostBody;
}

/**
 * Either a fixed Provider, or a function that picks one per request (e.g. to
 * support model switching from the client). The resolver receives the parsed
 * request body, so the client can send a `model` field and the server can map
 * it to the right provider.
 */
export type ProviderInput =
  | Provider
  | ((ctx: ProviderResolverContext) => Provider | Promise<Provider>);

export interface ChatRouteOptions {
  provider: ProviderInput;
  store: ConversationStore;
  system?: string | ((ctx: { conversationId: string }) => Promise<string> | string);
  tools?: ToolDef[];
  hooks?: AgentHooks;
  maxSteps?: number;
  /**
   * Optional auth hook. Return `null` to reject with 401, or a context object
   * (currently just `{ userId }`) to allow. If omitted, all requests pass.
   */
  auth?: (ctx: ChatRouteAuthContext) => Promise<{ userId: string } | null> | { userId: string } | null;
  /** Default model parameters. */
  temperature?: number;
  maxTokens?: number;
}

export interface ChatRoutePostBody {
  conversationId?: string;
  message: { content: AstonMessage["content"] };
  /** Optional: override the system prompt for this conversation on first message. */
  system?: string;
  /** Optional: title for a freshly created conversation. */
  title?: string;
  /** Arbitrary extra fields forwarded by the client `body` option (e.g. `model`). */
  [key: string]: unknown;
}

export interface ChatRoute {
  POST: (req: Request) => Promise<Response>;
  GET: (req: Request) => Promise<Response>;
}

const JSON_HEADERS = { "Content-Type": "application/json" };
const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

/**
 * Build a Next.js route handler (POST + GET) for an astonagent chat endpoint.
 *
 * POST body shape: { conversationId?, message: { content }, system?, title? }
 * GET ?conversationId=... → { messages: AstonMessage[] }
 * GET (no params) → { conversations: Conversation[] }
 */
export function createChatRoute(opts: ChatRouteOptions): ChatRoute {
  const POST = async (req: Request): Promise<Response> => {
    let authCtx: { userId: string } | null = null;
    if (opts.auth) {
      authCtx = await opts.auth({ request: req });
      if (!authCtx) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: JSON_HEADERS,
        });
      }
    }

    let body: ChatRoutePostBody;
    try {
      body = (await req.json()) as ChatRoutePostBody;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    if (!body?.message?.content || !Array.isArray(body.message.content)) {
      return new Response(JSON.stringify({ error: "message.content is required" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    let provider: Provider;
    try {
      provider =
        typeof opts.provider === "function"
          ? await opts.provider({ request: req, body })
          : opts.provider;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resolve provider";
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    // Resolve conversation: either existing or create one.
    let conversationId = body.conversationId;
    if (!conversationId) {
      const conv = await opts.store.createConversation({
        userId: authCtx?.userId,
        title: body.title,
        system: body.system,
      });
      conversationId = conv.id;
    } else {
      const existing = await opts.store.getConversation(conversationId);
      if (!existing) {
        // Auto-create with this id (idempotent)
        await opts.store.createConversation({
          id: conversationId,
          userId: authCtx?.userId,
          title: body.title,
          system: body.system,
        });
      }
    }

    const conv = await opts.store.getConversation(conversationId);
    const effectiveSystem =
      conv?.systemPrompt ??
      (typeof opts.system === "function"
        ? await opts.system({ conversationId })
        : opts.system);

    const userMessage: AstonMessage & { conversationId: string } = {
      id: newId("msg"),
      conversationId,
      role: "user",
      content: body.message.content,
      createdAt: new Date(),
    };
    await opts.store.saveMessage(userMessage);

    const history = await opts.store.listMessages(conversationId);
    const run = await opts.store.startRun({ conversationId });

    // Compose user hooks with persistence side effects
    const persistHooks: AgentHooks = {
      ...opts.hooks,
      onMessageComplete: async (msg, ctx) => {
        await opts.store.saveMessage({ ...msg, conversationId });
        await opts.hooks?.onMessageComplete?.(msg, ctx);
      },
    };

    const cid = conversationId;
    const finalUsage = { promptTokens: 0, completionTokens: 0, cachedTokens: 0 };
    let errored: Error | null = null;

    async function* withFinish(): AsyncIterable<StreamEvent> {
      try {
        // Send the conversation id as the very first frame so clients can grab it
        // when they created a new conversation server-side. This is a small
        // out-of-band annotation that the loop never emits itself.
        yield { type: "message-start", messageId: `conv:${cid}` } as StreamEvent;

        for await (const ev of runAgent({
          conversationId: cid,
          provider,
          messages: history,
          system: effectiveSystem ?? undefined,
          tools: opts.tools,
          hooks: persistHooks,
          maxSteps: opts.maxSteps,
          temperature: opts.temperature,
          maxTokens: opts.maxTokens,
          abortSignal: req.signal,
        })) {
          if (ev.type === "message-stop") {
            finalUsage.promptTokens += ev.usage.promptTokens;
            finalUsage.completionTokens += ev.usage.completionTokens;
            finalUsage.cachedTokens =
              (finalUsage.cachedTokens ?? 0) + (ev.usage.cachedTokens ?? 0);
          } else if (ev.type === "error") {
            errored = new Error(ev.error.message);
          }
          yield ev;
        }
      } finally {
        await opts.store.finishRun(run.id, {
          status: errored ? "error" : "complete",
          promptTokens: finalUsage.promptTokens,
          completionTokens: finalUsage.completionTokens,
          cachedTokens: finalUsage.cachedTokens,
          error: errored?.message ?? null,
        });
      }
    }

    return new Response(sseStream(withFinish()), {
      headers: { ...SSE_HEADERS, "X-Aston-Conversation-Id": cid },
    });
  };

  const GET = async (req: Request): Promise<Response> => {
    if (opts.auth) {
      const ok = await opts.auth({ request: req });
      if (!ok) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: JSON_HEADERS,
        });
      }
    }
    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversationId");
    if (conversationId) {
      const conv = await opts.store.getConversation(conversationId);
      if (!conv) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: JSON_HEADERS,
        });
      }
      const messages = await opts.store.listMessages(conversationId);
      return Response.json({ conversation: conv, messages });
    }
    const userId = url.searchParams.get("userId") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const conversations = await opts.store.listConversations({ userId, limit });
    return Response.json({ conversations });
  };

  return { POST, GET };
}
