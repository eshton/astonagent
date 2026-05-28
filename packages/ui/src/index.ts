export { ThemeProvider } from "./ThemeProvider.js";
export type { ThemeProviderProps } from "./ThemeProvider.js";

export { Chat } from "./Chat.js";
export type { ChatProps, ChatSlots, ChatChildrenState } from "./Chat.js";

export { MessageList } from "./MessageList.js";
export type { MessageListProps, MessageListSlots } from "./MessageList.js";

export { Composer } from "./Composer.js";
export type { ComposerProps } from "./Composer.js";

export {
  UserBubble,
  AssistantBubble,
  ToolMessage,
  ToolCallCard,
  ToolResultCard,
  ServerToolUseCard,
  ServerToolResultCard,
  StreamingIndicator,
} from "./components.js";

// Re-export the client hook for convenience.
export { useAstonChat } from "@astonagent/next/client";
export type { UseAstonChatOptions, UseAstonChatResult } from "@astonagent/next/client";
