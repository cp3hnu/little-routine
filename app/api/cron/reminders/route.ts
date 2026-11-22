import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { runReminderScan } from "@/lib/reminders";
import { runMonthEndReports } from "@/lib/monthly-reports";

export async function POST(request: Request) {
  const env = getEnv();
  const secret = request.headers.get("x-cron-secret");
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await runReminderScan(env);
  await runMonthEndReports(env);
  return NextResponse.json({ ok: true });
}
