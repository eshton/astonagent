"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AstonMessage, StreamEvent } from "@astonagent/core";
import { sseDecode } from "./sse.js";

export interface UseAstonChatOptions {
  /** Existing conversation id, or undefined to create one on first send. */
  conversationId?: string;
  /** Route URL. Default: "/api/chat". */
  endpoint?: string;
  /** Auto-load messages on mount if conversationId is set. Default true. */
  autoLoad?: boolean;
  /**
   * Extra fields merged into every POST body. Use this to pass a `model`,
   * tenant id, or any value your route's provider resolver reads.
   */
  body?: Record<string, unknown>;
  onError?: (err: Error) => void;
  onConversationCreated?: (id: string) => void;
}

export interface UseAstonChatResult {
  messages: AstonMessage[];
  conversationId: string | undefined;
  isStreaming: boolean;
  error: Error | null;
  send: (text: string, opts?: { system?: string; title?: string }) => Promise<void>;
  stop: () => void;
  /** Re-run the last user message after an error. */
  retry: () => void;
  /** Dismiss the current error without retrying. */
  clearError: () => void;
  /** Reset local state. Does not touch server. */
  reset: () => void;
}

function newClientId(): string {
  // Lightweight UUID v4 for client-side optimistic ids
  return (
    "msg_" +
    "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
  );
}

export function useAstonChat(options: UseAstonChatOptions = {}): UseAstonChatResult {
  const endpoint = options.endpoint ?? "/api/chat";
  const [messages, setMessages] = useState<AstonMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(options.conversationId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastSendRef = useRef<{ text: string; opts: { system?: string; title?: string } } | null>(
    null,
  );

  // Keep conversationId in sync when prop changes
  useEffect(() => {
    setConversationId(options.conversationId);
  }, [options.conversationId]);

  // Load existing messages
  useEffect(() => {
    if (!options.conversationId || options.autoLoad === false) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${endpoint}?conversationId=${encodeURIComponent(options.conversationId!)}`,
        );
        if (!res.ok) return;
        const body = (await res.json()) as { messages: AstonMessage[] };
        if (!cancelled) setMessages(body.messages);
      } catch {
        // swallow — empty state is fine
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [options.conversationId, options.autoLoad, endpoint]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  const send = useCallback(
    async (text: string, sendOpts: { system?: string; title?: string } = {}) => {
      if (!text.trim()) return;
      setError(null);
      lastSendRef.current = { text, opts: sendOpts };

      const userMsg: AstonMessage = {
        id: newClientId(),
        role: "user",
        content: [{ type: "text", text }],
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      let activeAssistantId: string | null = null;
      const update = (id: string, mutate: (msg: AstonMessage) => AstonMessage) => {
        setMessages((prev) => prev.map((m) => (m.id === id ? mutate(m) : m)));
      };

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...options.body,
            conversationId,
            message: { content: userMsg.content },
            system: sendOpts.system,
            title: sendOpts.title,
          }),
          signal: controller.signal,
        });

        const newConvId = res.headers.get("X-Aston-Conversation-Id");
        if (newConvId && newConvId !== conversationId) {
          setConversationId(newConvId);
          options.onConversationCreated?.(newConvId);
        }

        if (!res.ok || !res.body) {
          // Surface the server's error message (e.g. a missing API key) instead
          // of a bare status code.
          let message = `Request failed (${res.status})`;
          try {
            const errBody = (await res.json()) as { error?: string };
            if (errBody?.error) message = errBody.error;
          } catch {
            // non-JSON body — keep the status message
          }
          throw new Error(message);
        }

        for await (const ev of sseDecode(res.body) as AsyncIterable<StreamEvent>) {
          switch (ev.type) {
            case "message-start":
              if (ev.messageId.startsWith("conv:")) continue;
              activeAssistantId = ev.messageId;
              setMessages((prev) => [
                ...prev,
                { id: ev.messageId, role: "assistant", content: [], createdAt: new Date() },
              ]);
              break;
            case "text-delta": {
              if (!activeAssistantId) break;
              const id = activeAssistantId;
              update(id, (msg) => {
                const parts = [...msg.content];
                const last = parts[parts.length - 1];
                if (last && last.type === "text") {
                  parts[parts.length - 1] = { type: "text", text: last.text + ev.delta };
                } else {
                  parts.push({ type: "text", text: ev.delta });
                }
                return { ...msg, content: parts };
              });
              break;
            }
            case "tool-use-start": {
              if (!activeAssistantId) break;
              const id = activeAssistantId;
              update(id, (msg) => ({
                ...msg,
                content: [
                  ...msg.content,
                  { type: "tool_use", id: ev.id, name: ev.name, input: {} },
                ],
              }));
              break;
            }
            case "tool-use-input-delta":
              break; // input is filled in on tool-use-end
            case "tool-use-end": {
              if (!activeAssistantId) break;
              const id = activeAssistantId;
              update(id, (msg) => ({
                ...msg,
                content: msg.content.map((p) =>
                  p.type === "tool_use" && p.id === ev.id ? { ...p, input: ev.input } : p,
                ),
              }));
              break;
            }
            case "server-tool-use": {
              if (!activeAssistantId) break;
              const id = activeAssistantId;
              update(id, (msg) => ({
                ...msg,
                content: [
                  ...msg.content,
                  { type: "server_tool_use", id: ev.id, name: ev.name, input: ev.input },
                ],
              }));
              break;
            }
            case "server-tool-result": {
              if (!activeAssistantId) break;
              const id = activeAssistantId;
              update(id, (msg) => ({
                ...msg,
                content: [
                  ...msg.content,
                  { type: "server_tool_result", id: ev.id, name: ev.name, result: ev.result },
                ],
              }));
              break;
            }
            case "message-stop":
              activeAssistantId = null;
              break;
            case "error":
              throw new Error(ev.error.message);
          }
        }
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        // A user-initiated stop (abort) is not an error — just end quietly.
        if (e.name !== "AbortError") {
          setError(e);
          options.onError?.(e);
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
        // Drop a trailing assistant bubble that never produced content (e.g. an
        // error or stop before the first token) so it doesn't hang as "typing".
        if (activeAssistantId) {
          const id = activeAssistantId;
          setMessages((prev) =>
            prev.filter((m) => !(m.id === id && m.content.length === 0)),
          );
        }
      }
    },
    [endpoint, conversationId, options],
  );

  const retry = useCallback(() => {
    const last = lastSendRef.current;
    if (!last) return;
    setError(null);
    // Remove the last user message and anything after it (the failed assistant
    // turn); send() re-adds the user message and starts a fresh attempt.
    setMessages((prev) => {
      const idx = prev.map((m) => m.role).lastIndexOf("user");
      return idx === -1 ? prev : prev.slice(0, idx);
    });
    void send(last.text, last.opts);
  }, [send]);

  const clearError = useCallback(() => setError(null), []);

  return { messages, conversationId, isStreaming, error, send, stop, retry, clearError, reset };
}
