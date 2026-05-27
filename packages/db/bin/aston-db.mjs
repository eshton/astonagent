#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_ROOT = join(__dirname, "..", "migrations");

function usage() {
  console.log(`aston-db — astonagent migration helper

Usage:
  aston-db migrate [--dialect sqlite|pg] [--url <connection-string>]

Examples:
  aston-db migrate --dialect sqlite --url ./aston.sqlite
  aston-db migrate --dialect pg --url postgres://...

Env fallbacks:
  ASTON_DB_DIALECT (sqlite | pg)
  DATABASE_URL
`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      args[a.slice(2)] = argv[i + 1];
      i++;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function listMigrations(dialect) {
  const dir = join(MIGRATIONS_ROOT, dialect);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ name: f, sql: readFileSync(join(dir, f), "utf8") }));
}

async function migrateSqlite(url) {
  const { default: Database } = await import("better-sqlite3");
  const db = new Database(url);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  for (const m of listMigrations("sqlite")) {
    console.log(`→ ${m.name}`);
    db.exec(m.sql);
  }
  db.close();
}

async function migratePg(url) {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 1 });
  for (const m of listMigrations("pg")) {
    console.log(`→ ${m.name}`);
    await sql.unsafe(m.sql);
  }
  await sql.end();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || cmd === "help" || args.help) {
    usage();
    return;
  }
  if (cmd !== "migrate") {
    console.error(`Unknown command: ${cmd}`);
    usage();
    process.exit(1);
  }
  const dialect = args.dialect || process.env.ASTON_DB_DIALECT || "sqlite";
  const url = args.url || process.env.DATABASE_URL || "./aston.sqlite";
  console.log(`Running ${dialect} migrations against ${url}`);
  if (dialect === "sqlite") await migrateSqlite(url);
  else if (dialect === "pg") await migratePg(url);
  else {
    console.error(`Unknown dialect: ${dialect}`);
    process.exit(1);
  }
  console.log("✓ Migrations complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
