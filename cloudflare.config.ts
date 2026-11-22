import { bindings, defineConfig, defineWorker, triggers } from "cf/config";
import { createWorkersCacheConfig } from "@vinext/cloudflare/cache/config";

const cache = await createWorkersCacheConfig();

export default defineConfig({
  worker: defineWorker({
    ...cache,
    name: "little-routine",
    entrypoint: "./worker/index.ts",
    compatibilityDate: "2026-11-20",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    triggers: [triggers.scheduled({ schedule: "*/10 * * * *" })],
    env: {
      ...cache.env,
      ASSETS: bindings.assets(),
      VINEXT_KV_CACHE: bindings.kv(),
      DB: bindings.d1(),
      SESSION_KV: bindings.kv(),
      SESSION_SECRET: bindings.secret(),
      QWEN_API_KEY: bindings.secret(),
      QWEN_MODEL: bindings.text("qwen-plus"),
      QWEN_BASE_URL: bindings.text("https://dashscope.aliyuncs.com/compatible-mode/v1"),
      VAPID_PUBLIC_KEY: bindings.secret(),
      VAPID_PRIVATE_KEY: bindings.secret(),
      VAPID_SUBJECT: bindings.text("mailto:admin@example.com"),
      CRON_SECRET: bindings.secret(),
    },
  }),
});
