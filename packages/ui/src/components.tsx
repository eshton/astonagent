import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  AstonMessage,
  ServerToolResultPart,
  ServerToolUsePart,
  ToolResultPart,
  ToolUsePart,
} from "@astonagent/core";

export interface UserBubbleProps {
  message: AstonMessage;
}

export function UserBubble({ message }: UserBubbleProps) {
  const text = message.content
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join("\n");
  return (
    <div className="aston-row" data-role="user">
      <div className="aston-bubble" data-role="user">
        {text}
      </div>
    </div>
  );
}

export interface AssistantBubbleProps {
  message: AstonMessage;
}

export function AssistantBubble({ message }: AssistantBubbleProps) {
  const blocks: ReactNode[] = [];
  for (const [i, p] of message.content.entries()) {
    if (p.type === "text") {
      blocks.push(
        <div key={`t${i}`} className="aston-bubble" data-role="assistant">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.text}</ReactMarkdown>
        </div>,
      );
    } else if (p.type === "tool_use") {
      blocks.push(<ToolCallCard key={`tc${i}`} call={p} />);
    } else if (p.type === "server_tool_use") {
      blocks.push(<ServerToolUseCard key={`stu${i}`} call={p} />);
    } else if (p.type === "server_tool_result") {
      blocks.push(<ServerToolResultCard key={`str${i}`} result={p} />);
    }
  }
  if (blocks.length === 0) {
    blocks.push(
      <div key="empty" className="aston-bubble" data-role="assistant">
        <StreamingIndicator />
      </div>,
    );
  }
  return (
    <div className="aston-row" data-role="assistant">
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: "100%" }}>
        {blocks}
      </div>
    </div>
  );
}

export interface ToolMessageProps {
  message: AstonMessage;
}

export function ToolMessage({ message }: ToolMessageProps) {
  const results = message.content.filter((p): p is ToolResultPart => p.type === "tool_result");
  if (results.length === 0) return null;
  return (
    <div className="aston-row" data-role="tool">
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: "100%" }}>
        {results.map((r, i) => (
          <ToolResultCard key={i} result={r} />
        ))}
      </div>
    </div>
  );
}

export interface ToolCallCardProps {
  call: ToolUsePart;
}

export function ToolCallCard({ call }: ToolCallCardProps) {
  return (
    <div className="aston-tool-card">
      <div className="aston-tool-card-name">→ {call.name}()</div>
      <div className="aston-tool-card-section">input</div>
      <pre>{JSON.stringify(call.input, null, 2)}</pre>
    </div>
  );
}

export interface ToolResultCardProps {
  result: ToolResultPart;
}

export function ToolResultCard({ result }: ToolResultCardProps) {
  const text =
    typeof result.output === "string"
      ? result.output
      : JSON.stringify(result.output, null, 2);
  return (
    <div className="aston-tool-card" data-error={result.isError ? "true" : undefined}>
      <div className="aston-tool-card-name">
        ← result{result.isError ? " (error)" : ""}
      </div>
      <pre>{text}</pre>
    </div>
  );
}

export interface ServerToolUseCardProps {
  call: ServerToolUsePart;
}

export function ServerToolUseCard({ call }: ServerToolUseCardProps) {
  const query =
    call.input && typeof call.input === "object" && "query" in call.input
      ? String((call.input as { query: unknown }).query)
      : undefined;
  const label = call.name === "web_search" ? "Searching the web" : call.name;
  return (
    <div className="aston-server-tool" data-kind="use">
      <span className="aston-server-tool-icon" aria-hidden="true">
        ⌕
      </span>
      <span>
        {label}
        {query ? (
          <>
            : <strong>{query}</strong>
          </>
        ) : null}
      </span>
    </div>
  );
}

interface SourceLink {
  url: string;
  title?: string;
}

function extractSources(result: unknown): SourceLink[] {
  if (!Array.isArray(result)) return [];
  const out: SourceLink[] = [];
  for (const item of result) {
    if (item && typeof item === "object" && "url" in item) {
      const url = String((item as { url: unknown }).url);
      const title =
        "title" in item && (item as { title?: unknown }).title
          ? String((item as { title: unknown }).title)
          : undefined;
      out.push({ url, title });
    }
  }
  return out;
}

export interface ServerToolResultCardProps {
  result: ServerToolResultPart;
}

export function ServerToolResultCard({ result }: ServerToolResultCardProps) {
  const sources = extractSources(result.result);
  if (sources.length === 0) return null;
  return (
    <div className="aston-server-tool" data-kind="result">
      <div className="aston-sources-title">Sources</div>
      <ol className="aston-sources">
        {sources.map((s, i) => (
          <li key={i}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title || s.url}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function StreamingIndicator() {
  return (
    <span className="aston-streaming-indicator" aria-label="Assistant is typing">
      <span />
      <span />
      <span />
    </span>
  );
}
