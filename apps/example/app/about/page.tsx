import { Logo } from "../_components/Logo";
import { ExternalIcon } from "../_components/Icons";

export const metadata = { title: "About · AstonAgent" };

export default function AboutPage() {
  return (
    <div className="page">
      <div className="page-inner">
        <div className="hero-logo">
          <Logo size={56} />
        </div>
        <h1>About AstonAgent</h1>
        <p className="lead">
          AstonAgent is an open-source TypeScript framework for building agentic apps. Stop
          rebuilding the same plumbing for every client — install a few packages and get a
          streaming agent loop, swappable providers, persistence, and a polished, themeable chat
          UI.
        </p>

        <h2>What’s in the box</h2>
        <p>
          The framework ships as composable npm packages: <code>@astonagent/core</code> (the agent
          loop and interfaces), <code>@astonagent/providers</code> (Anthropic, OpenAI, and Ollama),{" "}
          <code>@astonagent/db</code> (Drizzle-backed persistence for SQLite and Postgres),{" "}
          <code>@astonagent/ui</code> (React chat components with CSS-variable theming), and{" "}
          <code>@astonagent/next</code> (a route-handler factory and the <code>useAstonChat</code>{" "}
          hook).
        </p>

        <h2>This demo</h2>
        <p>
          Everything you see here is the example app that ships in the repo — it dogfoods the whole
          stack and doubles as the framework’s acceptance test.
        </p>

        <p style={{ marginTop: 28 }}>
          <a
            className="btn-primary"
            href="https://github.com/eshton/astonagent"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
            <ExternalIcon width={16} height={16} />
          </a>
        </p>
      </div>
    </div>
  );
}
