import { Logo } from "./_components/Logo";

export default function HomePage() {
  return (
    <div className="page">
      <div className="page-inner">
        <div className="hero-logo">
          <Logo size={56} />
        </div>
        <h1>Welcome to AstonAgent</h1>
        <p className="lead">
          A streaming agent chat demo built on the astonagent framework — one agent loop,
          swappable providers, persistent conversations, and fully themeable UI.
        </p>

        <div className="card-grid">
          <div className="card">
            <h3>Switch models live</h3>
            <p>
              A single <code>/api/chat</code> route resolves the provider per request. Pick any
              configured model from the chat header — only models whose API key is set appear.
            </p>
          </div>
          <div className="card">
            <h3>Tool calling</h3>
            <p>
              Ask <em>“What’s the weather in Tokyo?”</em> to watch the <code>getWeather</code> tool
              run, with <code>tool_use</code> / <code>tool_result</code> blocks rendered inline.
            </p>
          </div>
          <div className="card">
            <h3>Theme on the fly</h3>
            <p>
              Open the gear menu in the top-right. CSS variables drive the entire look — chat,
              chrome, and all — without a remount.
            </p>
          </div>
        </div>

        <h2>Get started</h2>
        <p>
          Click <strong>New chat</strong> in the sidebar to begin. Set <code>ANTHROPIC_API_KEY</code>,{" "}
          <code>OPENAI_API_KEY</code>, or <code>OLLAMA_API_KEY</code> in <code>.env.local</code> to
          talk to the real providers.
        </p>
        <div className="chip-row">
          <span className="chip">Anthropic Claude</span>
          <span className="chip">OpenAI</span>
          <span className="chip">Ollama Cloud</span>
        </div>
      </div>
    </div>
  );
}
