import { createChatRoute } from "@astonagent/next";
import { anthropic } from "@astonagent/providers/anthropic";
import { drizzleStore } from "@astonagent/db";
import { db } from "@/lib/db";
import { getWeather } from "@/lib/tools";

export const runtime = "nodejs";

const route = createChatRoute({
  provider: anthropic({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
  store: drizzleStore(db),
  system: "You are a friendly assistant demoing the astonagent framework. Be concise.",
  tools: [getWeather],
});

export const { POST, GET } = route;
