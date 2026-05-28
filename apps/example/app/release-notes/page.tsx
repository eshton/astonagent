export const metadata = { title: "Release notes · AstonAgent" };

interface Release {
  version: string;
  date: string;
  items: string[];
}

const RELEASES: Release[] = [
  {
    version: "v0.1.0",
    date: "May 2026",
    items: [
      "Initial release of the astonagent monorepo (core, providers, db, ui, next).",
      "Streaming agent loop with tool-calling and hookable side effects.",
      "Anthropic Claude and OpenAI providers behind one stable Provider interface.",
      "Added an Ollama provider for Ollama Cloud and local daemons.",
      "Made API keys optional — a missing key only errors when that provider is used.",
      "Per-request model switching via a provider resolver and a Model dropdown.",
      "Drizzle-backed persistence (SQLite + Postgres) with conversation history.",
      "Themeable React chat UI: CSS variables, Tailwind preset, and slot overrides.",
      "Polished demo shell: collapsible sidebar, settings menu, About & release pages.",
    ],
  },
];

export default function ReleaseNotesPage() {
  return (
    <div className="page">
      <div className="page-inner">
        <h1>Release notes</h1>
        <p className="lead">What’s new in AstonAgent, newest first.</p>

        {RELEASES.map((r) => (
          <div className="release" key={r.version}>
            <div className="release-version">
              <h3>{r.version}</h3>
              <span className="release-date">{r.date}</span>
            </div>
            <ul>
              {r.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
