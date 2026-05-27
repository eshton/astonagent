"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeProvider } from "@astonagent/ui";

const THEMES = [
  { id: "aston-default", label: "Light" },
  { id: "aston-dark", label: "Dark" },
  { id: "claude-classic", label: "Claude Classic" },
  { id: "vercel-mono", label: "Vercel Mono" },
  { id: "terminal-green", label: "Terminal" },
];

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<string>("aston-default");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  // Persist theme choice locally
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("aston-theme") : null;
    if (saved) setTheme(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("aston-theme", theme);
  }, [theme]);

  // Load conversations
  const refresh = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const body = (await res.json()) as { conversations: Conversation[] };
      setConversations(body.conversations);
    } catch {}
  };
  useEffect(() => {
    refresh();
  }, [pathname]);

  const newConversation = async () => {
    const res = await fetch("/api/conversations", { method: "POST", body: "{}" });
    const body = (await res.json()) as { conversation: { id: string } };
    router.push(`/chat/${body.conversation.id}`);
    setTimeout(refresh, 50);
  };

  return (
    <ThemeProvider theme={theme} style={{ height: "100vh" }}>
      <div className="app-shell">
        <aside className="sidebar">
          <h1>astonagent</h1>
          <button onClick={newConversation}>+ New chat</button>
          <div className="sidebar-section">Provider demos</div>
          <Link href="/" data-active={pathname === "/" ? "true" : undefined}>
            Home
          </Link>
          <div className="sidebar-section">Conversations</div>
          {conversations.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--aston-muted)" }}>None yet</div>
          )}
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              data-active={pathname === `/chat/${c.id}` ? "true" : undefined}
            >
              {c.title ?? c.id.slice(0, 16)}
            </Link>
          ))}
        </aside>
        <main className="chat-wrap">
          <div className="topbar">
            <div className="topbar-title">astonagent demo</div>
            <label style={{ fontSize: 13, color: "var(--aston-muted)" }}>
              Theme:{" "}
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
