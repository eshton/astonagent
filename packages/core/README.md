# @astonagent/core

Types, agent loop, and the stable `Provider` and `ConversationStore` interfaces that the rest of astonagent builds on. Zero runtime dependencies beyond `zod`.

## Install

```bash
npm install @astonagent/core
```

## What's here

- `runAgent(opts)` — the streaming async-generator agent loop with tool-calling and hooks.
- `Provider` — the contract every model adapter implements.
- `ToolDef` / `defineTool` — Zod-validated tool definitions.
- `ConversationStore` — the persistence contract.
- `AstonMessage` / `ContentPart` / `StreamEvent` — the shared wire types.

See the [root README](https://github.com/astonagent/astonagent) for end-to-end usage.
