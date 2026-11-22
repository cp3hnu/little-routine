import vinextHandler from "vinext/server/fetch-handler";
import { runReminderScan } from "../lib/reminders";
import { runMonthEndReports } from "../lib/monthly-reports";

type Env = {
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
};

const fetchHandler =
  typeof vinextHandler === "function"
    ? vinextHandler
    : (vinextHandler as { fetch: ExportedHandlerFetchHandler<Env> }).fetch;

async function runScheduledJobs(env: Env) {
  await runReminderScan(env);
  await runMonthEndReports(env);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return fetchHandler(request, env, ctx);
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduledJobs(env));
  },
};
