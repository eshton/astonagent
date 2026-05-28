"use client";

import { useEffect, useState, use } from "react";
import { Chat } from "@astonagent/ui";
import type { ModelDef } from "@/lib/models";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [models, setModels] = useState<ModelDef[]>([]);
  const [model, setModel] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/models");
        if (!res.ok) return;
        const body = (await res.json()) as { models: ModelDef[] };
        setModels(body.models);
        if (body.models.length > 0 && !model) setModel(body.models[0]!.id);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="chat-header">
        <div className="chat-header-id">
          Conversation <code>{id.slice(5, 17)}</code>
        </div>
        <label className="model-select">
          <span>Model</span>
          {models.length === 0 ? (
            <span className="muted-note">none available — set an API key</span>
          ) : (
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
        </label>
      </div>
      <Chat key={id} conversationId={id} endpoint="/api/chat" body={{ model }} />
    </>
  );
}
