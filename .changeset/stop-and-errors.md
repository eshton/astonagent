---
"@astonagent/core": minor
"@astonagent/next": minor
"@astonagent/ui": minor
---

Stop generation and error handling.

- **Stop**: the loop now persists whatever the assistant produced before an abort or error, so stopping mid-stream keeps the partial reply on refresh. (`useAstonChat.stop()` and the Composer's Stop button already existed.)
- **Errors surfaced**: `useAstonChat` reads the server's error body (e.g. a missing API key) instead of a bare status code, drops a stuck empty "typing" bubble after a failure/stop, and exposes `retry()` and `clearError()`.
- **UI**: `<Chat>` renders a dismissible error banner with a "Try again" button.
