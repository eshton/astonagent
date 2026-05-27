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
  isStreaming: boolean;
  error: Error | null;
  conversationId: string | undefined;
}

export function Chat({
  conversationId,
  endpoint = "/api/chat",
  system,
  title,
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
