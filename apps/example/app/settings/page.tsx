"use client";

import { useEffect, useState } from "react";
import { readKeys, writeKeys, type ApiKeys } from "@/lib/keys";
import type { ProviderId } from "@/lib/models";
import { KeyIcon, CheckIcon } from "../_components/Icons";

interface ProviderMeta {
  id: ProviderId;
  label: string;
  placeholder: string;
  link: string;
  linkLabel: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    placeholder: "sk-ant-…",
    link: "https://console.anthropic.com/settings/keys",
    linkLabel: "console.anthropic.com",
  },
  {
    id: "openai",
    label: "OpenAI",
    placeholder: "sk-…",
    link: "https://platform.openai.com/api-keys",
    linkLabel: "platform.openai.com",
  },
  {
    id: "ollama",
    label: "Ollama Cloud",
    placeholder: "ollama key…",
    link: "https://ollama.com/settings/keys",
    linkLabel: "ollama.com",
  },
];

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [envProviders, setEnvProviders] = useState<ProviderId[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKeys(readKeys());
    (async () => {
      try {
        const res = await fetch("/api/models");
        if (res.ok) {
          const body = (await res.json()) as { envProviders: ProviderId[] };
          setEnvProviders(body.envProviders ?? []);
        }
      } catch {}
    })();
  }, []);

  const update = (id: ProviderId, value: string) => {
    setKeys((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  };

  const save = () => {
    const cleaned: ApiKeys = {};
    for (const p of PROVIDERS) {
      const v = keys[p.id]?.trim();
      if (v) cleaned[p.id] = v;
    }
    writeKeys(cleaned);
    setKeys(cleaned);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const clearAll = () => {
    writeKeys({});
    setKeys({});
    setSaved(false);
  };

  return (
    <div className="page">
      <div className="page-inner">
        <div className="hero-logo" style={{ filter: "none" }}>
          <span className="settings-badge">
            <KeyIcon width={26} height={26} />
          </span>
        </div>
        <h1>Settings</h1>
        <p className="lead">
          Manage the API keys used to talk to each provider. Keys are stored only in this browser
          and sent with each chat request — they are never saved on the server.
        </p>

        <h2>API keys</h2>
        <div className="settings-form">
          {PROVIDERS.map((p) => {
            const envSet = envProviders.includes(p.id);
            return (
              <div className="key-row" key={p.id}>
                <div className="key-row-head">
                  <label htmlFor={`key-${p.id}`}>{p.label}</label>
                  {envSet && <span className="key-env-badge">configured on server</span>}
                </div>
                <input
                  id={`key-${p.id}`}
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={envSet ? "Using server key — override here" : p.placeholder}
                  value={keys[p.id] ?? ""}
                  onChange={(e) => update(p.id, e.target.value)}
                />
                <a className="key-help" href={p.link} target="_blank" rel="noreferrer">
                  Get a key at {p.linkLabel}
                </a>
              </div>
            );
          })}
        </div>

        <div className="settings-actions">
          <button className="btn-primary" onClick={save}>
            {saved ? (
              <>
                <CheckIcon width={16} height={16} /> Saved
              </>
            ) : (
              "Save keys"
            )}
          </button>
          <button className="btn-ghost" onClick={clearAll}>
            Clear all
          </button>
        </div>

        <p className="settings-note">
          Tip: you can also provide keys via environment variables
          (<code>ANTHROPIC_API_KEY</code>, <code>OPENAI_API_KEY</code>, <code>OLLAMA_API_KEY</code>)
          in <code>.env.local</code>. A key entered here overrides the server key for that provider.
        </p>
      </div>
    </div>
  );
}
