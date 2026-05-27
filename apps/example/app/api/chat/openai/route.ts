import { createChatRoute } from "@astonagent/next";
import { openai } from "@astonagent/providers/openai";
import { drizzleStore } from "@astonagent/db";
import { db } from "@/lib/db";
import { getWeather } from "@/lib/tools";

export const runtime = "nodejs";

const route = createChatRoute({
  provider: openai({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
  }),
  store: drizzleStore(db),
  system: "You are a friendly assistant demoing the astonagent framework. Be concise.",
  tools: [getWeather],
});

export const { POST, GET } = route;
