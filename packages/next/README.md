# @astonagent/next

Next.js helpers for astonagent: a route-handler factory that streams the agent loop over SSE, plus a `useAstonChat` client hook that consumes it.

## Install

```bash
npm install @astonagent/next @astonagent/core
```

## Server — `createChatRoute`

```ts
// app/api/chat/route.ts
import { createChatRoute } from "@astonagent/next";
import { anthropic } from "@astonagent/providers/anthropic";
import { drizzleStore } from "@astonagent/db";
import { db } from "@/lib/db";

export const { POST, GET } = createChatRoute({
  provider: anthropic({ model: "claude-sonnet-4-5", apiKey: process.env.ANTHROPIC_API_KEY! }),
  store: drizzleStore(db),
  system: "You are a helpful assistant.",
});
```

## Client — `useAstonChat`

```tsx
"use client";
import { useAstonChat } from "@astonagent/next/client";

export function MyChat({ id }: { id?: string }) {
  const { messages, send, isStreaming, stop } = useAstonChat({
    conversationId: id,
    endpoint: "/api/chat",
  });
  // ... render messages, composer, etc.
}
```

## Wire format

The route streams [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events). Each frame is a `StreamEvent` from `@astonagent/core` encoded as a single `data: ` line. Use `sseEncodeEvent` / `sseDecode` to interop manually.

The `X-Aston-Conversation-Id` response header on POST tells you the conversation id that was used (created if not provided).
