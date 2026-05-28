"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { Chat } from "@astonagent/ui";
import { MODELS, type ModelDef, type ProviderId } from "@/lib/models";
import { readKeys, storedProviders } from "@/lib/keys";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [envProviders, setEnvProviders] = useState<ProviderId[]>([]);
  const [browserProviders, setBrowserProviders] = useState<ProviderId[]>([]);
  const [model, setModel] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/models");
        if (res.ok) {
          const body = (await res.json()) as { envProviders: ProviderId[] };
          setEnvProviders(body.envProviders ?? []);
        }
      } catch {}
      setBrowserProviders(storedProviders());
    })();
  }, []);

  const available: ModelDef[] = useMemo(() => {
    const usable = new Set<ProviderId>([...envProviders, ...browserProviders]);
    return MODELS.filter((m) => usable.has(m.provider));
  }, [envProviders, browserProviders]);

  useEffect(() => {
    if (available.length > 0 && !available.some((m) => m.id === model)) {
      setModel(available[0]!.id);
    }
  }, [available, model]);

  // BYOK: attach the browser-stored key for the selected model's provider, if any.
  const apiKey = useMemo(() => {
    const selected = MODELS.find((m) => m.id === model);
    if (!selected) return undefined;
    return readKeys()[selected.provider];
  }, [model]);

  return (
    <>
      <div className="chat-header">
        <div className="chat-header-id">
          Conversation <code>{id.slice(5, 17)}</code>
        </div>
        <label className="model-select">
          <span>Model</span>
          {available.length === 0 ? (
            <Link href="/settings" className="muted-note" style={{ textDecoration: "underline" }}>
              No models — add an API key
            </Link>
          ) : (
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {available.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
        </label>
      </div>
      <Chat key={id} conversationId={id} endpoint="/api/chat" body={{ model, apiKey }} />
    </>
  );
}
