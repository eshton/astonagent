"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { Chat } from "@astonagent/ui";
import { MODELS, type ModelDef, type ProviderId } from "@/lib/models";
import { SKILLS } from "@/lib/skills";
import { readKeys, storedProviders } from "@/lib/keys";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [envProviders, setEnvProviders] = useState<ProviderId[]>([]);
  const [browserProviders, setBrowserProviders] = useState<ProviderId[]>([]);
  const [model, setModel] = useState<string>("");
  const [enabledSkills, setEnabledSkills] = useState<string[]>([]);

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

  const selectedModel = useMemo(() => MODELS.find((m) => m.id === model), [model]);

  // BYOK: attach the browser-stored key for the selected model's provider, if any.
  const apiKey = useMemo(
    () => (selectedModel ? readKeys()[selectedModel.provider] : undefined),
    [selectedModel],
  );

  const skillSupported = (skillName: string): boolean => {
    const meta = SKILLS.find((s) => s.name === skillName);
    if (!meta) return false;
    if (meta.requiresWebSearch) return Boolean(selectedModel?.webSearch);
    return true;
  };

  // Only send skills the current model actually supports.
  const activeSkills = useMemo(
    () => enabledSkills.filter(skillSupported),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabledSkills, selectedModel],
  );

  const toggleSkill = (name: string) => {
    setEnabledSkills((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  return (
    <>
      <div className="chat-header">
        <div className="chat-header-skills">
          {SKILLS.map((s) => {
            const on = activeSkills.includes(s.name);
            const supported = skillSupported(s.name);
            return (
              <button
                key={s.name}
                type="button"
                className="skill-toggle"
                data-on={on ? "true" : undefined}
                disabled={!supported}
                title={
                  supported ? s.description : `${s.label} needs a web-search-capable model`
                }
                onClick={() => toggleSkill(s.name)}
              >
                <span className="skill-dot" />
                {s.label}
              </button>
            );
          })}
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
      <Chat
        key={id}
        conversationId={id}
        endpoint="/api/chat"
        body={{ model, apiKey, skills: activeSkills }}
      />
    </>
  );
}
