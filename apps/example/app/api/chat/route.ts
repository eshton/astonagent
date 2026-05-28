import { createChatRoute } from "@astonagent/next";
import { drizzleStore } from "@astonagent/db";
import { db } from "@/lib/db";
import { getWeather } from "@/lib/tools";
import { resolveProvider } from "@/lib/resolve-provider";

export const runtime = "nodejs";

const route = createChatRoute({
  // Resolve the provider per request from the `model` and optional `apiKey`
  // (BYOK) fields the client sends. The key is used only to construct the
  // provider — it is never persisted.
  provider: ({ body }) =>
    resolveProvider(body.model as string | undefined, body.apiKey as string | undefined),
  store: drizzleStore(db),
  system: "You are a friendly assistant demoing the astonagent framework. Be concise.",
  tools: [getWeather],
});

export const { POST, GET } = route;
