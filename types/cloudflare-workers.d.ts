declare module "cloudflare:workers" {
  export const env: Cloudflare.Env;
}

declare namespace Cloudflare {
  interface Env {
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
    VINEXT_KV_CACHE: KVNamespace;
    ASSETS: Fetcher;
  }
}
