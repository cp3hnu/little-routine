import { drizzle } from "drizzle-orm/d1";
import { getEnv } from "../env";
import * as schema from "./schema";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'zh',
  theme TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  UNIQUE(user_id, family_id)
);
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_wake_time TEXT NOT NULL DEFAULT '07:00',
  target_sleep_time TEXT NOT NULL DEFAULT '21:30',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sleep_logs (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  local_date TEXT NOT NULL,
  wake_at TEXT,
  sleep_at TEXT,
  note TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(child_id, local_date)
);
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS reminder_prefs (
  child_id TEXT PRIMARY KEY,
  wake_remind INTEGER NOT NULL DEFAULT 1,
  sleep_remind INTEGER NOT NULL DEFAULT 1,
  minutes_before INTEGER NOT NULL DEFAULT 15
);
CREATE TABLE IF NOT EXISTS period_reports (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  period_type TEXT NOT NULL,
  period_key TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'zh',
  metrics_json TEXT NOT NULL,
  narrative_json TEXT NOT NULL,
  model TEXT,
  metrics_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(child_id, period_type, period_key, locale)
);
`;

let schemaReady: Promise<void> | null = null;

const SCHEMA_MIGRATIONS = [
  // Idempotent: SQLite/D1 errors if the column already exists.
  `ALTER TABLE users ADD COLUMN nickname TEXT NOT NULL DEFAULT ''`,
];

export async function ensureSchema(db: D1Database = getEnv().DB) {
  if (!schemaReady) {
    schemaReady = (async () => {
      const statements = SCHEMA_SQL.split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await db.prepare(statement).run();
      }
      for (const statement of SCHEMA_MIGRATIONS) {
        try {
          await db.prepare(statement).run();
        } catch {
          // Column already present (or table just created with the column).
        }
      }
    })();
  }
  await schemaReady;
}

export async function getDb() {
  const env = getEnv();
  await ensureSchema(env.DB);
  return drizzle(env.DB, { schema });
}
