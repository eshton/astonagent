import { useEffect, useRef, type ComponentType } from "react";
import type { AstonMessage } from "@astonagent/core";
import {
  AssistantBubble,
  ToolMessage,
  UserBubble,
} from "./components.js";

export interface MessageListSlots {
  UserBubble?: ComponentType<{ message: AstonMessage }>;
  AssistantBubble?: ComponentType<{ message: AstonMessage }>;
  ToolMessage?: ComponentType<{ message: AstonMessage }>;
  Empty?: ComponentType;
}

export interface MessageListProps {
  messages: AstonMessage[];
  components?: MessageListSlots;
  autoScroll?: boolean;
}

export function MessageList({
  messages,
  components = {},
  autoScroll = true,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScroll) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, autoScroll]);

  const U = components.UserBubble ?? UserBubble;
  const A = components.AssistantBubble ?? AssistantBubble;
  const T = components.ToolMessage ?? ToolMessage;
  const Empty = components.Empty;

  if (messages.length === 0 && Empty) {
    return (
      <div className="aston-message-list" ref={listRef}>
        <Empty />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="aston-message-list" ref={listRef}>
        <div className="aston-empty">Send a message to start the conversation.</div>
      </div>
    );
  }

  return (
    <div className="aston-message-list" ref={listRef}>
      {messages.map((m) => {
        if (m.role === "user") return <U key={m.id} message={m} />;
        if (m.role === "assistant") return <A key={m.id} message={m} />;
        if (m.role === "tool") return <T key={m.id} message={m} />;
        return null;
      })}
    </div>
  );
}
