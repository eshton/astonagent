# @astonagent/db

Drizzle-based persistence for astonagent. Same schema and store API across SQLite (dev) and Postgres (prod).

## Install

```bash
npm install @astonagent/db drizzle-orm
# pick your driver:
npm install better-sqlite3
# or
npm install postgres
```

## Usage

```ts
// lib/db.ts — SQLite
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteSchema } from "@astonagent/db";

const sqlite = new Database("./aston.sqlite");
export const db = drizzle(sqlite, { schema: sqliteSchema });
```

```ts
// lib/db.ts — Postgres
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { pgSchema } from "@astonagent/db";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema: pgSchema });
```

```ts
import { drizzleStore, pgSchema } from "@astonagent/db";
const store = drizzleStore(db, { schema: pgSchema }); // omit schema for sqlite default
```

## Migrations

```bash
npx aston-db migrate --dialect sqlite --url ./aston.sqlite
npx aston-db migrate --dialect pg --url $DATABASE_URL
```

## Testing helper

```ts
import { memoryStore } from "@astonagent/db";
const store = memoryStore(); // ephemeral, no driver required
```
