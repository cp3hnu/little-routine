import { env as workerEnv } from "cloudflare:workers";

export type AppEnv = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  SESSION_SECRET: string;
  QWEN_API_KEY: string;
  QWEN_MODEL: string;
  QWEN_BASE_URL: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  CRON_SECRET: string;
};

export function getEnv(): AppEnv {
  return workerEnv as unknown as AppEnv;
}
