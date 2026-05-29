"use client";

import type { ComponentType } from "react";
import type { AstonMessage } from "@astonagent/core";
import { useAstonChat } from "@astonagent/next/client";
import { Composer } from "./Composer.js";
import { MessageList, type MessageListSlots } from "./MessageList.js";

export interface ChatSlots extends MessageListSlots {
  Composer?: ComponentType<{
    onSubmit: (text: string) => void;
    onStop: () => void;
    isStreaming: boolean;
  }>;
}

export interface ChatProps {
  /** Conversation id. If omitted, a new conversation is created on first send. */
  conversationId?: string;
  /** Chat API URL. Default: "/api/chat". */
  endpoint?: string;
  /** Optional initial system prompt to seed a new conversation. */
  system?: string;
  /** Optional title for a newly created conversation. */
  title?: string;
  /** Extra fields merged into every POST body (e.g. `{ model }`). */
  body?: Record<string, unknown>;
  components?: ChatSlots;
  className?: string;
  placeholder?: string;
  onConversationCreated?: (id: string) => void;
  onError?: (err: Error) => void;
  /** Render prop alternative — if provided, you control layout. */
  children?: (state: ChatChildrenState) => React.ReactNode;
}

export interface ChatChildrenState {
  messages: AstonMessage[];
  send: (text: string, opts?: { system?: string; title?: string }) => Promise<void>;
  stop: () => void;
  retry: () => void;
  clearError: () => void;
  isStreaming: boolean;
  error: Error | null;
  conversationId: string | undefined;
}

export function Chat({
  conversationId,
  endpoint = "/api/chat",
  system,
  title,
  body,
  components = {},
  className,
  placeholder,
  onConversationCreated,
  onError,
  children,
}: ChatProps) {
  const chat = useAstonChat({
    conversationId,
    endpoint,
    body,
    onConversationCreated,
    onError,
  });

  if (children) {
    return (
      <>
        {children({
          messages: chat.messages,
          send: chat.send,
          stop: chat.stop,
          retry: chat.retry,
          clearError: chat.clearError,
          isStreaming: chat.isStreaming,
          error: chat.error,
          conversationId: chat.conversationId,
        })}
      </>
    );
  }

  const ComposerComp = components.Composer;

  return (
    <div className={["aston-chat", className].filter(Boolean).join(" ")}>
      <MessageList
        messages={chat.messages}
        components={components}
      />
      {chat.error && (
        <div className="aston-error" role="alert">
          <span className="aston-error-icon" aria-hidden="true">
            !
          </span>
          <span className="aston-error-message">{chat.error.message}</span>
          <button className="aston-error-retry" onClick={chat.retry}>
            Try again
          </button>
          <button
            className="aston-error-dismiss"
            onClick={chat.clearError}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
      {ComposerComp ? (
        <ComposerComp
          onSubmit={(text) => chat.send(text, { system, title })}
          onStop={chat.stop}
          isStreaming={chat.isStreaming}
        />
      ) : (
        <Composer
          onSubmit={(text) => chat.send(text, { system, title })}
          onStop={chat.stop}
          isStreaming={chat.isStreaming}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
