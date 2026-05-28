# astonagent example

Working Next.js 15 App Router app that exercises the whole framework:

- A single `/api/chat` route that resolves the provider per request, with a Model dropdown switching between Anthropic, OpenAI, and Ollama Cloud models. Only models whose API key is set appear (via `/api/models`).
- Conversation sidebar built locally (proves the package doesn't need to ship one).
- Theme switcher (`Light`, `Dark`, `Claude Classic`, `Vercel Mono`, `Terminal`) — CSS variable swaps only.
- `getWeather` tool wired through to demonstrate tool-calling across providers.
- SQLite by default — set `ASTON_SQLITE_PATH` or migrate to Postgres with `npx aston-db migrate --dialect pg --url $DATABASE_URL`.

## Run

```bash
cp .env.local.example .env.local   # add your keys
pnpm dev                            # from monorepo root, or:
pnpm --filter @astonagent/example dev
```

The app self-migrates the SQLite database on first boot.
