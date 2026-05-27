import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteSchema } from "@astonagent/db";

const DB_PATH = process.env.ASTON_SQLITE_PATH ?? "./aston.sqlite";

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS aston_conversations (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT,
  user_id TEXT,
  system_prompt TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE IF NOT EXISTS aston_messages (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES aston_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS aston_messages_conv_idx ON aston_messages (conversation_id);
CREATE TABLE IF NOT EXISTS aston_runs (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES aston_conversations(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cached_tokens INTEGER,
  error TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS aston_runs_conv_idx ON aston_runs (conversation_id);
`;

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(INIT_SQL);

export const db = drizzle(sqlite, { schema: sqliteSchema });
export { sqliteSchema };
