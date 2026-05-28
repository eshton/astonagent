import { createChatRoute } from "@astonagent/next";
import { drizzleStore } from "@astonagent/db";
import { db } from "@/lib/db";
import { getWeather } from "@/lib/tools";
import { resolveProvider } from "@/lib/resolve-provider";

export const runtime = "nodejs";

const route = createChatRoute({
  // Resolve the provider per request from the `model` field the client sends.
  provider: ({ body }) => resolveProvider(body.model as string | undefined),
  store: drizzleStore(db),
  system: "You are a friendly assistant demoing the astonagent framework. Be concise.",
  tools: [getWeather],
});

export const { POST, GET } = route;
