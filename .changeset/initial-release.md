---
"@astonagent/core": minor
"@astonagent/providers": minor
"@astonagent/db": minor
"@astonagent/ui": minor
"@astonagent/next": minor
---

Initial v0.1.0 release.

- `@astonagent/core` — agent loop, `Provider` interface, `ConversationStore` interface, shared types.
- `@astonagent/providers` — Anthropic Claude + OpenAI adapters with normalized `StreamEvent` output.
- `@astonagent/db` — Drizzle schema + repos for SQLite and Postgres, plus `memoryStore` for tests.
- `@astonagent/ui` — React chat components (`<Chat>`, `<MessageList>`, `<Composer>`, `<ThemeProvider>`), CSS-variable theming, Tailwind preset.
- `@astonagent/next` — `createChatRoute` route-handler factory and `useAstonChat` client hook.
