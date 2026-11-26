"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "./locale-provider";
import { Modal } from "./modal";
import { ChildTabs } from "./child-tabs";
import { EmptyChildren } from "./empty-children";
import { TimePicker } from "./time-picker";
import {
  formatHm,
  formatHms,
  getCheckinMode,
  isSleepWindow,
  isWakeWindow,
  sleepLogDate,
  wakeLogDate,
  type CheckinMode
} from "@/lib/period";

type Child = {
  id: string;
  name: string;
  targetWakeTime: string;
  targetSleepTime: string;
};

type SleepLog = {
  localDate: string;
  wakeAt: string | null;
  sleepAt: string | null;
};

export function HomeCheckin({ childrenList }: { childrenList: Child[] }) {
  const { t, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [childId, setChildId] = useState(childrenList[0]?.id || "");
  const [wakeLog, setWakeLog] = useState<SleepLog | null>(null);
  const [sleepLog, setSleepLog] = useState<SleepLog | null>(null);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editKind, setEditKind] = useState<"wake" | "sleep">("wake");
  const [editTime, setEditTime] = useState("07:00");
  const [flash, setFlash] = useState("");

  const mode: CheckinMode = now ? getCheckinMode(now) : "none";
  const child = childrenList.find(c => c.id === childId) || childrenList[0];
  const wakeDate = now ? wakeLogDate(now) : "";
  const sleepDate = now ? sleepLogDate(now) : "";
  const wakeAt = wakeLog?.wakeAt ?? null;
  const sleepAt = sleepLog?.sleepAt ?? null;
  const canWakeEdit = mounted && !!now && (!!wakeAt || isWakeWindow(now));
  const canSleepEdit = mounted && !!now && (!!sleepAt || isSleepWindow(now));
  const canCheckin = mounted && !!now && ((mode === "wake" && !wakeAt) || (mode === "sleep" && !sleepAt)) && !saving;

  const loadLog = useCallback(async (id: string, localDate: string) => {
    const res = await fetch(`/api/sleep-logs?childId=${id}&start=${localDate}&end=${localDate}`);
    const data = (await res.json()) as { logs: SleepLog[] };
    return data.logs?.[0] ?? null;
  }, []);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!childId || !wakeDate || !sleepDate) return;
    let cancelled = false;
    (async () => {
      if (wakeDate === sleepDate) {
        const log = await loadLog(childId, wakeDate);
        if (cancelled) return;
        setWakeLog(log);
        setSleepLog(log);
      } else {
        const [w, s] = await Promise.all([loadLog(childId, wakeDate), loadLog(childId, sleepDate)]);
        if (cancelled) return;
        setWakeLog(w);
        setSleepLog(s);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [childId, wakeDate, sleepDate, loadLog]);

  useEffect(() => {
    if (childrenList.length && !childrenList.some(c => c.id === childId)) {
      setChildId(childrenList[0].id);
    }
  }, [childrenList, childId]);

  if (!childrenList.length) {
    return <EmptyChildren />;
  }

  async function saveField(kind: "wake" | "sleep", time: string) {
    if (!child || !now) return;
    const localDate = kind === "wake" ? wakeLogDate(now) : sleepLogDate(now);
    setSaving(true);
    setFlash("");
    const existing = kind === "wake" ? wakeLog : sleepLog;
    const body = {
      childId: child.id,
      localDate,
      wakeAt: kind === "wake" ? time : (existing?.wakeAt ?? null),
      sleepAt: kind === "sleep" ? time : (existing?.sleepAt ?? null)
    };
    if (wakeDate === sleepDate && wakeLog) {
      body.wakeAt = kind === "wake" ? time : wakeLog.wakeAt;
      body.sleepAt = kind === "sleep" ? time : wakeLog.sleepAt;
    }
    const res = await fetch("/api/sleep-logs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setSaving(false);
    if (!res.ok) return;

    const next: SleepLog = {
      localDate,
      wakeAt: body.wakeAt,
      sleepAt: body.sleepAt
    };
    if (kind === "wake") {
      setWakeLog(next);
      if (wakeDate === sleepDate) setSleepLog(next);
    } else {
      setSleepLog(next);
      if (wakeDate === sleepDate) setWakeLog(next);
    }
    setFlash(t.checkedIn);
    setTimeout(() => setFlash(""), 1800);
  }

  async function onPrimaryCheckin() {
    if (!canCheckin || !now) return;
    const hm = formatHm(now);
    if (mode === "wake") await saveField("wake", hm);
    else if (mode === "sleep") await saveField("sleep", hm);
  }

  function openEdit(kind: "wake" | "sleep") {
    if (kind === "wake" && !canWakeEdit) return;
    if (kind === "sleep" && !canSleepEdit) return;
    setEditKind(kind);
    if (kind === "wake") {
      setEditTime(wakeAt || child?.targetWakeTime || "07:00");
    } else {
      setEditTime(sleepAt || child?.targetSleepTime || "21:30");
    }
    setEditOpen(true);
  }

  async function confirmEdit() {
    await saveField(editKind, editTime);
    setEditOpen(false);
  }

  const orbTone = mode === "sleep" ? "sleep" : "wake";
  const primaryLabel = mode === "wake" ? t.wakeCheckin : mode === "sleep" ? t.sleepCheckin : t.appName;
  const clockText = mounted && now ? formatHms(now) : "--:--:--";
  const alreadyDone = mode === "wake" ? !!wakeAt : mode === "sleep" ? !!sleepAt : false;
  const dateText =
    mounted && now
      ? now.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short"
        })
      : "\u00A0";

  return (
    <div className="space-y-4">
      {childrenList.length > 1 ? (
        <ChildTabs childrenList={childrenList} value={child.id} onChange={setChildId} />
      ) : null}

      <section className="flex flex-col items-center gap-4 pt-6 pb-2">
        <p className="home-date" suppressHydrationWarning>
          {dateText}
        </p>
        <button
          type="button"
          className={`checkin-orb ${orbTone}${canCheckin ? "" : " done"}${mode === "none" ? " idle" : ""}`}
          disabled={!canCheckin}
          onClick={onPrimaryCheckin}
          aria-disabled={!canCheckin}
        >
          <div className="px-4 text-center">
            <div className="text-sm font-semibold opacity-90">
              {mode === "none" ? primaryLabel : alreadyDone ? t.checkedIn : primaryLabel}
            </div>
            <div className="clock-time mt-2 text-[clamp(2.6rem,12vw,3.6rem)]" suppressHydrationWarning>
              {clockText}
            </div>
            <div className="mt-2 text-sm font-medium opacity-85">{canCheckin ? t.tapToCheckin : "\u00A0"}</div>
          </div>
        </button>

        {flash ? <p className="text-sm font-semibold text-(--ok)">{flash}</p> : null}

        <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
          <StatusChip
            label={t.wake}
            value={wakeAt}
            tone="wake"
            editLabel={t.edit}
            canEdit={canWakeEdit}
            onEdit={() => openEdit("wake")}
          />
          <StatusChip
            label={t.sleep}
            value={sleepAt}
            tone="sleep"
            editLabel={t.edit}
            canEdit={canSleepEdit}
            onEdit={() => openEdit("sleep")}
          />
        </div>
      </section>

      <Modal open={editOpen} title={editKind === "wake" ? t.wake : t.sleep} onClose={() => setEditOpen(false)}>
        <div className="space-y-3">
          <div>
            <label className="label">{t.pickTime}</label>
            <TimePicker value={editTime} onChange={setEditTime} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setEditOpen(false)}>
              {t.cancel}
            </button>
            <button type="button" className="btn btn-primary flex-1" disabled={saving} onClick={confirmEdit}>
              {t.save}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12.5 7.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function StatusChip({
  label,
  value,
  tone,
  editLabel,
  canEdit,
  onEdit
}: {
  label: string;
  value: string | null | undefined;
  tone: "wake" | "sleep";
  editLabel: string;
  canEdit: boolean;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      className="status-chip"
      data-tone={tone}
      disabled={!canEdit}
      onClick={onEdit}
      aria-label={editLabel}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold opacity-70">{label}</div>
        <span className="status-chip-edit" aria-hidden="true">
          <EditIcon />
        </span>
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value || "--"}</div>
    </button>
  );
}
