import { and, eq, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { children, sleepLogs, type Child, type SleepLog } from "./db/schema";
import { sha256Hex } from "./crypto";
import { compareTime, monthBounds, prevMonthKey, yearBounds } from "./time";

export type PeriodMetrics = {
  childName: string;
  periodType: "month" | "year";
  periodKey: string;
  loggedDays: number;
  wakeSuccessDays: number;
  sleepSuccessDays: number;
  bothSuccessDays: number;
  wakeRate: number;
  sleepRate: number;
  bothRate: number;
  avgWakeTime: string | null;
  avgSleepTime: string | null;
  avgSleepMinutes: number | null;
  longestWakeStreak: number;
  longestSleepStreak: number;
  prevWakeRate: number | null;
  prevSleepRate: number | null;
  monthlyTrend?: Array<{
    month: string;
    wakeRate: number;
    sleepRate: number;
    loggedDays: number;
  }>;
  bestMonth?: string | null;
  weakestMonth?: string | null;
};

function avgTime(times: string[]): string | null {
  if (!times.length) return null;
  const mins = times.map((t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  });
  const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length);
  const h = Math.floor(avg / 60) % 24;
  const m = avg % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function sleepDurationMinutes(sleepAt: string, wakeAt: string): number {
  const s = compareTime(sleepAt, "00:00");
  let w = compareTime(wakeAt, "00:00");
  if (w <= s) w += 24 * 60;
  return w - s;
}

function longestStreak(flags: boolean[]): number {
  let best = 0;
  let cur = 0;
  for (const ok of flags) {
    if (ok) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}

function summarizeLogs(child: Child, logs: SleepLog[]) {
  const sorted = [...logs].sort((a, b) => a.localDate.localeCompare(b.localDate));
  const wakeFlags: boolean[] = [];
  const sleepFlags: boolean[] = [];
  const wakeTimes: string[] = [];
  const sleepTimes: string[] = [];
  const durations: number[] = [];
  let wakeSuccess = 0;
  let sleepSuccess = 0;
  let both = 0;

  for (const log of sorted) {
    const wakeOk = !!log.wakeAt && compareTime(log.wakeAt, child.targetWakeTime) <= 0;
    const sleepOk = !!log.sleepAt && compareTime(log.sleepAt, child.targetSleepTime) <= 0;
    if (log.wakeAt) {
      wakeTimes.push(log.wakeAt);
      wakeFlags.push(wakeOk);
      if (wakeOk) wakeSuccess += 1;
    }
    if (log.sleepAt) {
      sleepTimes.push(log.sleepAt);
      sleepFlags.push(sleepOk);
      if (sleepOk) sleepSuccess += 1;
    }
    if (log.wakeAt && log.sleepAt) {
      durations.push(sleepDurationMinutes(log.sleepAt, log.wakeAt));
      if (wakeOk && sleepOk) both += 1;
    }
  }

  const loggedDays = sorted.length;
  const wakeLogged = wakeFlags.length || 1;
  const sleepLogged = sleepFlags.length || 1;

  return {
    loggedDays,
    wakeSuccessDays: wakeSuccess,
    sleepSuccessDays: sleepSuccess,
    bothSuccessDays: both,
    wakeRate: Math.round((wakeSuccess / wakeLogged) * 100),
    sleepRate: Math.round((sleepSuccess / sleepLogged) * 100),
    bothRate: Math.round((both / (loggedDays || 1)) * 100),
    avgWakeTime: avgTime(wakeTimes),
    avgSleepTime: avgTime(sleepTimes),
    avgSleepMinutes: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null,
    longestWakeStreak: longestStreak(wakeFlags),
    longestSleepStreak: longestStreak(sleepFlags),
  };
}

async function loadLogs(childId: string, start: string, end: string) {
  const db = await getDb();
  return db
    .select()
    .from(sleepLogs)
    .where(
      and(
        eq(sleepLogs.childId, childId),
        gte(sleepLogs.localDate, start),
        lte(sleepLogs.localDate, end),
      ),
    );
}

export async function computePeriodMetrics(
  childId: string,
  periodType: "month" | "year",
  periodKey: string,
): Promise<PeriodMetrics> {
  const db = await getDb();
  const [child] = await db.select().from(children).where(eq(children.id, childId)).limit(1);
  if (!child) throw new Error("CHILD_NOT_FOUND");

  const bounds = periodType === "month" ? monthBounds(periodKey) : yearBounds(periodKey);
  const logs = await loadLogs(childId, bounds.start, bounds.end);
  const summary = summarizeLogs(child, logs);

  let prevWakeRate: number | null = null;
  let prevSleepRate: number | null = null;
  let monthlyTrend: PeriodMetrics["monthlyTrend"];
  let bestMonth: string | null = null;
  let weakestMonth: string | null = null;

  if (periodType === "month") {
    const prevKey = prevMonthKey(periodKey);
    const prev = monthBounds(prevKey);
    const prevLogs = await loadLogs(childId, prev.start, prev.end);
    if (prevLogs.length) {
      const prevSummary = summarizeLogs(child, prevLogs);
      prevWakeRate = prevSummary.wakeRate;
      prevSleepRate = prevSummary.sleepRate;
    }
  } else {
    const year = Number(periodKey);
    monthlyTrend = [];
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, "0")}`;
      const b = monthBounds(key);
      const monthLogs = logs.filter((l) => l.localDate >= b.start && l.localDate <= b.end);
      const s = summarizeLogs(child, monthLogs);
      monthlyTrend.push({
        month: key,
        wakeRate: s.wakeRate,
        sleepRate: s.sleepRate,
        loggedDays: s.loggedDays,
      });
    }
    const scored = monthlyTrend.filter((m) => m.loggedDays > 0);
    if (scored.length) {
      bestMonth = [...scored].sort(
        (a, b) => b.wakeRate + b.sleepRate - (a.wakeRate + a.sleepRate),
      )[0].month;
      weakestMonth = [...scored].sort(
        (a, b) => a.wakeRate + a.sleepRate - (b.wakeRate + b.sleepRate),
      )[0].month;
    }
  }

  return {
    childName: child.name,
    periodType,
    periodKey,
    ...summary,
    prevWakeRate,
    prevSleepRate,
    monthlyTrend,
    bestMonth,
    weakestMonth,
  };
}

export async function metricsHash(metrics: PeriodMetrics): Promise<string> {
  return sha256Hex(JSON.stringify(metrics));
}
