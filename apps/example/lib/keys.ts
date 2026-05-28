// Client-side BYOK storage. Keys live in the browser's localStorage and are
// sent with each chat request — never persisted on the server. The server
// falls back to environment variables when no key is provided.

import type { ProviderId } from "./models";

const STORAGE_KEY = "aston-api-keys";

export type ApiKeys = Partial<Record<ProviderId, string>>;

export function readKeys(): ApiKeys {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as ApiKeys;
  } catch {
    return {};
  }
}

export function writeKeys(keys: ApiKeys): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function storedProviders(keys: ApiKeys = readKeys()): ProviderId[] {
  return (Object.keys(keys) as ProviderId[]).filter((p) => Boolean(keys[p]?.trim()));
}
