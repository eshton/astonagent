import type { Config } from "tailwindcss";

const preset: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        "aston-bg": "var(--aston-bg)",
        "aston-fg": "var(--aston-fg)",
        "aston-muted": "var(--aston-muted)",
        "aston-border": "var(--aston-border)",
        "aston-accent": "var(--aston-accent)",
        "aston-bubble-user-bg": "var(--aston-bubble-user-bg)",
        "aston-bubble-user-fg": "var(--aston-bubble-user-fg)",
        "aston-bubble-assistant-bg": "var(--aston-bubble-assistant-bg)",
        "aston-bubble-assistant-fg": "var(--aston-bubble-assistant-fg)",
        "aston-tool-bg": "var(--aston-tool-bg)",
        "aston-tool-fg": "var(--aston-tool-fg)",
        "aston-tool-border": "var(--aston-tool-border)",
      },
      borderRadius: {
        aston: "var(--aston-radius)",
        "aston-sm": "var(--aston-radius-sm)",
      },
      fontFamily: {
        "aston-sans": "var(--aston-font-sans)",
        "aston-mono": "var(--aston-font-mono)",
      },
    },
  },
};

export default preset;
