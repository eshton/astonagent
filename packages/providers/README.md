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

Both providers satisfy `Provider` from `@astonagent/core` and emit the same `StreamEvent` union, so the loop and UI are provider-agnostic.
