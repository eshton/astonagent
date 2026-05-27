export default function HomePage() {
  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ marginTop: 0 }}>Welcome to the astonagent demo</h2>
      <p>
        Click <strong>+ New chat</strong> in the sidebar to start a streaming conversation. The
        same UI is wired to two routes — Anthropic Claude and OpenAI — to demonstrate the
        provider-agnostic loop. Use the <strong>Theme</strong> dropdown in the top-right to
        watch CSS variables drive the entire look without remounting.
      </p>
      <p>Try saying:</p>
      <ul>
        <li><em>What is 2 + 2?</em> — plain streaming response.</li>
        <li>
          <em>What's the weather in Tokyo?</em> — invokes the <code>getWeather</code> tool;
          watch the <code>tool_use</code> / <code>tool_result</code> blocks render inline.
        </li>
      </ul>
      <p style={{ color: "var(--aston-muted)", fontSize: 14 }}>
        Set <code>ANTHROPIC_API_KEY</code> and <code>OPENAI_API_KEY</code> in
        <code> .env.local</code> to talk to the real providers.
      </p>
    </div>
  );
}
