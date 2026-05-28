---
"@astonagent/core": minor
"@astonagent/providers": minor
"@astonagent/next": minor
"@astonagent/ui": minor
---

Add skills and provider-native web search.

- **Skills** (`@astonagent/core`): `Skill` type, `defineSkill`, and `composeSkills` — composable bundles of system-prompt instructions, local tools, and provider-native server tools. `createChatRoute` accepts `skills` (a fixed list or a per-request resolver).
- **Server tools / web search**: new `ServerTool` type, `server_tool_use`/`server_tool_result` content parts and stream events, and `Provider.capabilities`. The Anthropic and OpenAI adapters perform native web search (Anthropic on all models; OpenAI on search-preview models); Ollama reports it unsupported. Ships as the built-in `webSearchSkill`.
- **UI**: renders an inline "Searching the web" indicator and a Sources list for server-tool results.
