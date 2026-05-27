"use client";

import { useState, use } from "react";
import { Chat } from "@astonagent/ui";

type Provider = "anthropic" | "openai";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [provider, setProvider] = useState<Provider>("anthropic");
  return (
    <>
      <div className="topbar" style={{ borderTop: "1px solid var(--aston-border)" }}>
        <div style={{ fontSize: 13, color: "var(--aston-muted)" }}>
          Conversation <code>{id.slice(0, 16)}</code>
        </div>
        <label style={{ fontSize: 13, color: "var(--aston-muted)" }}>
          Provider:{" "}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
          >
            <option value="anthropic">Anthropic Claude</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>
      </div>
      <Chat
        key={`${id}-${provider}`}
        conversationId={id}
        endpoint={`/api/chat/${provider}`}
      />
    </>
  );
}
