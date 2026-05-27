# @astonagent/ui

React chat UI for astonagent. Theme via CSS variables or a Tailwind preset; swap any component via slot overrides.

## Install

```bash
npm install @astonagent/ui @astonagent/core @astonagent/next
```

## Quick start

```tsx
// app/chat/[id]/page.tsx
import { Chat, ThemeProvider } from "@astonagent/ui";
import "@astonagent/ui/styles.css";

export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <ThemeProvider theme="aston-default">
      <Chat conversationId={params.id} endpoint="/api/chat" />
    </ThemeProvider>
  );
}
```

## Theming

### CSS variable override (90% of cases)

```css
/* app/globals.css */
@import "@astonagent/ui/styles.css";

[data-aston-theme="my-brand"] {
  --aston-accent: #ff6a3d;
  --aston-bubble-user-bg: var(--aston-accent);
  --aston-bubble-assistant-bg: #1a1a22;
  --aston-radius: 14px;
}
```

```tsx
<ThemeProvider theme="my-brand">...</ThemeProvider>
```

### Tailwind preset

```ts
// tailwind.config.ts
import astonPreset from "@astonagent/ui/tailwind";

export default {
  presets: [astonPreset],
  content: [/* yours */],
};
```

Use tokens like `bg-aston-accent`, `text-aston-fg`, `rounded-aston`, `font-aston-mono`.

### Slot overrides (escape hatch)

```tsx
<Chat
  components={{
    UserBubble: ({ message }) => <MyBubble msg={message} />,
    Composer: ({ onSubmit, isStreaming }) => <MyComposer ... />,
  }}
/>
```

## Components

- `<Chat>` — top-level chat widget. Owns transport.
- `<MessageList>`, `<UserBubble>`, `<AssistantBubble>`, `<ToolMessage>`, `<ToolCallCard>`, `<ToolResultCard>`
- `<Composer>` — auto-growing textarea, Enter to send, Shift-Enter for newline
- `<ThemeProvider>` — sets `data-aston-theme`
- `useAstonChat` — re-exported from `@astonagent/next/client`
