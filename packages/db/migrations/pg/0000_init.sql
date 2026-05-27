CREATE TABLE IF NOT EXISTS "aston_conversations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT,
  "user_id" TEXT,
  "system_prompt" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "aston_messages" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "conversation_id" TEXT NOT NULL REFERENCES "aston_conversations"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "aston_messages_conv_idx" ON "aston_messages" ("conversation_id");

CREATE TABLE IF NOT EXISTS "aston_runs" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "conversation_id" TEXT NOT NULL REFERENCES "aston_conversations"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL,
  "prompt_tokens" INTEGER,
  "completion_tokens" INTEGER,
  "cached_tokens" INTEGER,
  "error" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "aston_runs_conv_idx" ON "aston_runs" ("conversation_id");
