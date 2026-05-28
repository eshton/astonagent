"use client";

import { useEffect, useRef, useState } from "react";
import { GearIcon, CheckIcon } from "./Icons";

export interface ThemeOption {
  id: string;
  label: string;
  /** Two preview colors: [background, accent] */
  swatch: [string, string];
}

export const THEMES: ThemeOption[] = [
  { id: "aston-default", label: "Light", swatch: ["#ffffff", "#2563eb"] },
  { id: "aston-dark", label: "Dark", swatch: ["#0b0b10", "#818cf8"] },
  { id: "claude-classic", label: "Claude Classic", swatch: ["#f5f1ea", "#cc785c"] },
  { id: "vercel-mono", label: "Vercel Mono", swatch: ["#000000", "#ffffff"] },
  { id: "terminal-green", label: "Terminal", swatch: ["#0a0e0a", "#50fa7b"] },
];

export function SettingsMenu({
  theme,
  onThemeChange,
}: {
  theme: string;
  onThemeChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="settings" ref={ref}>
      <button
        className="icon-btn"
        aria-label="Settings"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <GearIcon />
      </button>
      {open && (
        <div className="popover" role="menu">
          <div className="popover-title">Theme</div>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className="theme-option"
                data-active={t.id === theme ? "true" : undefined}
                role="menuitemradio"
                aria-checked={t.id === theme}
                onClick={() => onThemeChange(t.id)}
              >
                <span
                  className="theme-swatch"
                  style={{
                    background: t.swatch[0],
                    boxShadow: `inset 0 0 0 1px rgba(127,127,127,0.25)`,
                  }}
                >
                  <span style={{ background: t.swatch[1] }} />
                </span>
                <span className="theme-label">{t.label}</span>
                {t.id === theme && <CheckIcon width={15} height={15} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
