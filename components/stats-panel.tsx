"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "./locale-provider";
import { Modal } from "./modal";
import { ChildTabs } from "./child-tabs";
import { TimePicker } from "./time-picker";
import { monthKey, todayLocal } from "@/lib/period";

type Child = { id: string; name: string; targetWakeTime: string; targetSleepTime: string };

type SleepLog = {
  localDate: string;
  wakeAt: string | null;
  sleepAt: string | null;
};

type Report = {
  metrics: {
    loggedDays: number;
    wakeRate: number;
    sleepRate: number;
    longestWakeStreak: number;
    longestSleepStreak: number;
  };
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function StatsPanel({ childrenList }: { childrenList: Child[] }) {
  const { t, locale } = useI18n();
  const [childId, setChildId] = useState(childrenList[0]?.id || "");
  const [cursor, setCursor] = useState(() => monthKey());
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [makeupDate, setMakeupDate] = useState<string | null>(null);
  const [makeupWake, setMakeupWake] = useState("");
  const [makeupSleep, setMakeupSleep] = useState("");
  const [lockedWake, setLockedWake] = useState(false);
  const [lockedSleep, setLockedSleep] = useState(false);
  const [saving, setSaving] = useState(false);

  const child = childrenList.find((c) => c.id === childId) || childrenList[0];
  const [year, month] = cursor.split("-").map(Number);
  const logMap = useMemo(() => new Map(logs.map((l) => [l.localDate, l])), [logs]);
  const today = todayLocal();

  const load = useCallback(async () => {
    if (!childId) return;
    const start = `${cursor}-01`;
    const end = `${cursor}-${String(daysInMonth(year, month)).padStart(2, "0")}`;
    const [logsRes, reportRes] = await Promise.all([
      fetch(`/api/sleep-logs?childId=${childId}&start=${start}&end=${end}`),
      fetch(`/api/reports?childId=${childId}&periodType=month&periodKey=${cursor}&locale=${locale}`),
    ]);
    const logsData = (await logsRes.json()) as { logs: SleepLog[] };
    const reportData = (await reportRes.json()) as Report;
    setLogs(logsData.logs || []);
    setReport(reportData?.metrics ? reportData : null);
  }, [childId, cursor, year, month, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setCursor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function openDay(day: number, isFuture: boolean) {
    if (!child || isFuture) return;
    const localDate = `${cursor}-${String(day).padStart(2, "0")}`;
    const existing = logMap.get(localDate);
    const hasWake = !!existing?.wakeAt;
    const hasSleep = !!existing?.sleepAt;
    // Only allow makeup for missing fields; fully logged days are locked
    if (hasWake && hasSleep) return;
    setMakeupDate(localDate);
    setLockedWake(hasWake);
    setLockedSleep(hasSleep);
    setMakeupWake(existing?.wakeAt || child.targetWakeTime || "07:00");
    setMakeupSleep(existing?.sleepAt || child.targetSleepTime || "21:30");
  }

  async function saveMakeup() {
    if (!child || !makeupDate) return;
    if (lockedWake && lockedSleep) return;
    setSaving(true);
    const existing = logMap.get(makeupDate);
    await fetch("/api/sleep-logs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId: child.id,
        localDate: makeupDate,
        wakeAt: lockedWake ? existing?.wakeAt ?? null : makeupWake || null,
        sleepAt: lockedSleep ? existing?.sleepAt ?? null : makeupSleep || null,
      }),
    });
    setSaving(false);
    setMakeupDate(null);
    await load();
  }

  const liveStats = useMemo(() => {
    let loggedDays = 0;
    let wakeOk = 0;
    let wakeN = 0;
    let sleepOk = 0;
    let sleepN = 0;
    for (const log of logs) {
      loggedDays += 1;
      if (log.wakeAt) {
        wakeN += 1;
        if (child && log.wakeAt <= child.targetWakeTime) wakeOk += 1;
      }
      if (log.sleepAt) {
        sleepN += 1;
        if (child && log.sleepAt <= child.targetSleepTime) sleepOk += 1;
      }
    }
    return {
      loggedDays,
      wakeRate: wakeN ? Math.round((wakeOk / wakeN) * 100) : 0,
      sleepRate: sleepN ? Math.round((sleepOk / sleepN) * 100) : 0,
    };
  }, [logs, child]);

  if (!childrenList.length) {
    return <div className="card p-6 text-(--muted)">{t.noChildren}</div>;
  }

  const totalDays = daysInMonth(year, month);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const monthLabel =
    locale === "en" ? cursor : `${year}年${String(month).padStart(2, "0")}月`;
  const loggedCount = report?.metrics.loggedDays ?? liveStats.loggedDays;
  const wakeRate = report?.metrics.wakeRate ?? liveStats.wakeRate;
  const sleepRate = report?.metrics.sleepRate ?? liveStats.sleepRate;

  return (
    <div className="space-y-4">
      <ChildTabs childrenList={childrenList} value={child.id} onChange={setChildId} />

      <section className="card soft-cal">
        <div className="soft-cal-header">
          <h2 className="soft-cal-title">{t.monthStats}</h2>
          <div className="soft-cal-nav">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="prev">
              ‹
            </button>
            <div className="soft-cal-nav-label">{monthLabel}</div>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="next">
              ›
            </button>
          </div>
        </div>

        <div className="soft-cal-weekdays">
          {(locale === "en"
            ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            : ["日", "一", "二", "三", "四", "五", "六"]
          ).map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="soft-cal-grid">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />;
            const localDate = `${cursor}-${String(day).padStart(2, "0")}`;
            const entry = logMap.get(localDate);
            const isToday = localDate === today;
            const isFuture = localDate > today;
            const wake = entry?.wakeAt;
            const sleep = entry?.sleepAt;
            const complete = !!wake && !!sleep;
            return (
              <button
                key={localDate}
                type="button"
                className={`soft-cal-cell${isToday ? " today" : ""}${isFuture ? " future" : ""}${complete ? " complete" : ""}`}
                onClick={() => openDay(day, isFuture)}
                disabled={isFuture}
              >
                <div className="soft-cal-day">{day}</div>
                <div className={`soft-cal-value wake${!wake ? " empty" : ""}`}>{wake || "—"}</div>
                <div className={`soft-cal-value sleep${!sleep ? " empty" : ""}`}>
                  {sleep || "—"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="soft-cal-footer">
          {t.monthLoggedSummary} <strong>{loggedCount}</strong> {t.monthLoggedUnit}
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <div className="grid grid-cols-3 gap-2">
          <Stat label={t.loggedDays} value={String(loggedCount)} />
          <Stat label={t.wakeRate} value={`${wakeRate}%`} />
          <Stat label={t.sleepRate} value={`${sleepRate}%`} />
        </div>
        <p className="text-sm font-medium text-(--accent)">{t.encouragement}</p>
      </section>

      <section className="card space-y-3 p-5">
        <div>
          <h3 className="text-sm font-semibold">{t.recommendedSchedule}</h3>
          <p className="mt-1 text-sm text-(--muted)">{t.recommendedScheduleHint}</p>
        </div>
        <ul className="space-y-2">
          <li className="schedule-row">
            <div className="schedule-row-title">{t.schedulePrimary}</div>
            <div className="schedule-row-detail">{t.schedulePrimaryDetail}</div>
          </li>
          <li className="schedule-row">
            <div className="schedule-row-title">{t.scheduleJunior}</div>
            <div className="schedule-row-detail">{t.scheduleJuniorDetail}</div>
          </li>
          <li className="schedule-row">
            <div className="schedule-row-title">{t.scheduleSenior}</div>
            <div className="schedule-row-detail">{t.scheduleSeniorDetail}</div>
          </li>
        </ul>
        <ul className="list-disc space-y-1 border-t border-(--border) pt-3 pl-5 text-sm text-(--muted)">
          <li>{t.scheduleTip1}</li>
          <li>{t.scheduleTip2}</li>
          <li>{t.scheduleTip3}</li>
        </ul>
      </section>

      <Modal
        open={!!makeupDate}
        title={`${t.makeup} · ${makeupDate || ""}`}
        onClose={() => setMakeupDate(null)}
      >
        <div className="space-y-3">
          <div>
            <label className="label">
              {t.wake}
              {!lockedWake ? `（${t.missingWake}）` : ""}
            </label>
            {lockedWake ? (
              <div className="makeup-locked">{makeupWake || "--"}</div>
            ) : (
              <TimePicker value={makeupWake || "07:00"} onChange={setMakeupWake} />
            )}
          </div>
          <div>
            <label className="label">
              {t.sleep}
              {!lockedSleep ? `（${t.missingSleep}）` : ""}
            </label>
            {lockedSleep ? (
              <div className="makeup-locked">{makeupSleep || "--"}</div>
            ) : (
              <TimePicker value={makeupSleep || "21:30"} onChange={setMakeupSleep} />
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setMakeupDate(null)}>
              {t.cancel}
            </button>
            <button type="button" className="btn btn-primary flex-1" disabled={saving} onClick={saveMakeup}>
              {t.confirmMakeup}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-(--accent-soft) p-3">
      <div className="text-xs text-(--muted)">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
