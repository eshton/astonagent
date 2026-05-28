# @astonagent/providers

Provider adapters that satisfy the `@astonagent/core` `Provider` interface. Hand-rolled (not wrapping Vercel AI SDK) so the public `StreamEvent` and tool-use shapes stay stable.

## Anthropic

```ts
import { anthropic } from "@astonagent/providers/anthropic";

const provider = anthropic({
  model: "claude-sonnet-4-5",
  apiKey: process.env.ANTHROPIC_API_KEY,
  // optional:
  maxTokens: 4096,
  cacheSystem: true,        // ephemeral cache_control on system prompt (default)
  cacheLastUserTurn: true,  // ephemeral cache_control on most recent user text (default)
});
```

## OpenAI

```ts
import { openai } from "@astonagent/providers/openai";

const provider = openai({
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
});
```

## Ollama (cloud or local)

Ollama exposes an OpenAI-compatible endpoint, so this adapter delegates to the
OpenAI one with Ollama's base URL and key.

```ts
import { ollama } from "@astonagent/providers/ollama";

// Cloud (default base URL https://ollama.com/v1)
const cloud = ollama({
  model: "gpt-oss:120b",
  apiKey: process.env.OLLAMA_API_KEY,
});

// Local daemon
const local = ollama({
  model: "llama3.2",
  baseURL: "http://localhost:11434/v1",
});
```

### Ollama web search tool

Ollama's hosted Web Search API is a standalone REST endpoint, not an
in-completion server search. Expose it to any model as a regular tool:

```ts
import { ollamaWebSearch } from "@astonagent/providers/ollama";

const tools = [ollamaWebSearch({ apiKey: process.env.OLLAMA_API_KEY })];
// pass `tools` to runAgent / createChatRoute, or bundle it into a Skill
```

## Web search

Anthropic and OpenAI run web search **server-side** during a completion — enable
it with the built-in `webSearchSkill` (or `serverTools: [{ type: "web_search" }]`)
from `@astonagent/core`. OpenAI needs a search-capable model (e.g.
`gpt-4o-search-preview`). Ollama instead uses the `ollamaWebSearch` **tool** above.

All providers satisfy `Provider` from `@astonagent/core` and emit the same `StreamEvent` union, so the loop and UI are provider-agnostic. API keys are read lazily — a missing key only errors when that provider is actually used to stream.
