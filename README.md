# astonagent

> An opinionated open-source TypeScript framework for building agentic apps. Loop, providers, persistence, themeable chat UI, and Next.js glue — all as `npm install`-able packages.

Stop rebuilding the same agent plumbing for every new client. `astonagent` ships:

- A streaming **agent loop** with tool-calling and hookable side effects
- First-class **Anthropic Claude** + **OpenAI** providers behind one stable interface
- **Persistence** via Drizzle ORM (SQLite for dev, Postgres for prod) — bring your own database
- A polished **React chat UI** that themes via CSS variables and a Tailwind preset
- A **Next.js** route-handler factory and `useAstonChat` hook that wire everything together

## Quick start

```bash
npm install @astonagent/core @astonagent/providers @astonagent/db @astonagent/ui @astonagent/next
```

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

```tsx
// app/chat/[id]/page.tsx
import { Chat, ThemeProvider } from "@astonagent/ui";

export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <ThemeProvider theme="aston-default">
      <Chat conversationId={params.id} endpoint="/api/chat" />
    </ThemeProvider>
  );
}
```

That's the whole framework. See [`apps/example`](./apps/example) for a working app.

## Packages

| Package                 | Purpose                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| `@astonagent/core`      | Types, agent loop, `Provider` interface, `ConversationStore` interface        |
| `@astonagent/providers` | Anthropic + OpenAI adapters                                                   |
| `@astonagent/db`        | Drizzle schema, repos, `drizzleStore`, `memoryStore`, `aston-db migrate` bin  |
| `@astonagent/ui`        | `<Chat>`, `<ThemeProvider>`, Tailwind preset, default theme                   |
| `@astonagent/next`      | `createChatRoute`, `useAstonChat`, SSE codecs                                 |

## Development

```bash
pnpm install
pnpm build
pnpm --filter @astonagent/example dev
```

## License

Apache-2.0
