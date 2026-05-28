"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeProvider } from "@astonagent/ui";
import { Logo } from "./Logo";
import { SettingsMenu } from "./SettingsMenu";
import {
  ChatIcon,
  HomeIcon,
  InfoIcon,
  NotesIcon,
  PanelIcon,
  PlusIcon,
} from "./Icons";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

const NAV = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/about", label: "About", icon: InfoIcon },
  { href: "/release-notes", label: "Release notes", icon: NotesIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<string>("aston-default");
  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  // Restore persisted UI prefs
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = localStorage.getItem("aston-theme");
    if (savedTheme) setTheme(savedTheme);
    setCollapsed(localStorage.getItem("aston-sidebar-collapsed") === "1");
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("aston-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("aston-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

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
      <div className="app-shell" data-collapsed={collapsed ? "true" : undefined}>
        <aside className="sidebar" aria-hidden={collapsed}>
          <button className="new-chat" onClick={newConversation}>
            <PlusIcon width={16} height={16} />
            <span>New chat</span>
          </button>

          <nav className="nav">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} data-active={pathname === href ? "true" : undefined}>
                <Icon width={17} height={17} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-section">Conversations</div>
          <div className="conversation-list">
            {conversations.length === 0 && <div className="muted-note">No chats yet</div>}
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className="conversation-link"
                data-active={pathname === `/chat/${c.id}` ? "true" : undefined}
              >
                <ChatIcon width={15} height={15} />
                <span className="conversation-title">{c.title ?? c.id.slice(5, 17)}</span>
              </Link>
            ))}
          </div>

          <div className="sidebar-footer">
            <a href="https://github.com/eshton/astonagent" target="_blank" rel="noreferrer">
              astonagent · v0.1.0
            </a>
          </div>
        </aside>

        <div className="main-col">
          <header className="topbar">
            <div className="topbar-left">
              <button
                className="icon-btn"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => setCollapsed((v) => !v)}
              >
                <PanelIcon />
              </button>
              <Link href="/" className="brand">
                <Logo size={30} />
                <span className="brand-name">AstonAgent</span>
                <span className="brand-badge">demo</span>
              </Link>
            </div>
            <div className="topbar-right">
              <button className="signin-btn">Sign in</button>
              <div className="avatar" title="Guest">AA</div>
              <SettingsMenu theme={theme} onThemeChange={setTheme} />
            </div>
          </header>
          <main className="content">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
