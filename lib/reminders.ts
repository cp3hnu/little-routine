import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import { children, families, familyMembers, pushSubscriptions, reminderPrefs } from "./db/schema";
import { ensureSchema } from "./db";
import { localDateString, localTimeString, minutesFromHhMm } from "./time";
import { sendWebPush } from "./push";

type ReminderEnv = {
  DB: D1Database;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
};

function withinWindow(nowMinutes: number, targetMinutes: number, before: number): boolean {
  // Cron every 10 minutes: match if now is in [target-before, target-before+9]
  const remindAt = (targetMinutes - before + 24 * 60) % (24 * 60);
  const diff = (nowMinutes - remindAt + 24 * 60) % (24 * 60);
  return diff < 10;
}

export async function runReminderScan(env: ReminderEnv) {
  await ensureSchema(env.DB);
  const db = drizzle(env.DB, { schema });
  const now = new Date();

  const rows = await db
    .select({
      child: children,
      family: families,
      prefs: reminderPrefs,
      userId: familyMembers.userId,
    })
    .from(children)
    .innerJoin(families, eq(families.id, children.familyId))
    .innerJoin(familyMembers, eq(familyMembers.familyId, families.id))
    .leftJoin(reminderPrefs, eq(reminderPrefs.childId, children.id));

  const sent = new Set<string>();

  for (const row of rows) {
    const tz = row.family.timezone || "Asia/Shanghai";
    const nowHm = localTimeString(now, tz);
    const today = localDateString(now, tz);
    const nowMin = minutesFromHhMm(nowHm);
    const before = row.prefs?.minutesBefore ?? 15;
    const wakeRemind = row.prefs?.wakeRemind ?? true;
    const sleepRemind = row.prefs?.sleepRemind ?? true;

    const messages: string[] = [];
    if (wakeRemind && withinWindow(nowMin, minutesFromHhMm(row.child.targetWakeTime), before)) {
      messages.push(`该起床啦：${row.child.name} 目标起床 ${row.child.targetWakeTime}`);
    }
    if (sleepRemind && withinWindow(nowMin, minutesFromHhMm(row.child.targetSleepTime), before)) {
      messages.push(`该睡觉啦：${row.child.name} 目标睡觉 ${row.child.targetSleepTime}`);
    }
    if (!messages.length) continue;

    const key = `${row.userId}:${row.child.id}:${today}:${nowHm.slice(0, 4)}`;
    if (sent.has(key)) continue;
    sent.add(key);

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, row.userId), eq(pushSubscriptions.enabled, true)));

    for (const sub of subs) {
      for (const body of messages) {
        await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          { title: "小小作息", body, url: "/" },
        );
      }
    }
  }
}
