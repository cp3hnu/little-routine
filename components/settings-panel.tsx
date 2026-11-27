"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "./locale-provider";
import { Modal } from "./modal";
import { EmptyChildren } from "./empty-children";
import { TimePicker } from "./time-picker";

type Child = {
  id: string;
  name: string;
  targetWakeTime: string;
  targetSleepTime: string;
};

export function SettingsPanel({
  initialChildren,
  firstChildId,
}: {
  initialChildren: Child[];
  firstChildId?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>(initialChildren ?? []);
  const [addOpen, setAddOpen] = useState(false);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [name, setName] = useState("");
  const [wake, setWake] = useState("07:00");
  const [sleep, setSleep] = useState("21:30");
  const [minutesBefore, setMinutesBefore] = useState(15);
  const [pushStatus, setPushStatus] = useState("");
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setName("");
    setWake("07:00");
    setSleep("21:30");
    setAddOpen(true);
  }

  function openEdit(child: Child) {
    setEditChild(child);
    setName(child.name);
    setWake(child.targetWakeTime);
    setSleep(child.targetSleepTime);
  }

  async function refreshChildren() {
    const res = await fetch("/api/children");
    const data = (await res.json()) as { children: Child[] };
    setChildren(data.children || []);
    router.refresh();
  }

  async function createChild() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        targetWakeTime: wake,
        targetSleepTime: sleep,
      }),
    });
    setSaving(false);
    setAddOpen(false);
    await refreshChildren();
  }

  async function updateChild() {
    if (!editChild || !name.trim()) return;
    setSaving(true);
    await fetch(`/api/children/${editChild.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        targetWakeTime: wake,
        targetSleepTime: sleep,
      }),
    });
    setSaving(false);
    setEditChild(null);
    await refreshChildren();
  }

  async function removeChild(id: string) {
    await fetch(`/api/children/${id}`, { method: "DELETE" });
    await refreshChildren();
  }

  async function enablePush() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushStatus("denied");
      return;
    }
    const keyRes = await fetch("/api/push/vapid-public-key");
    const { publicKey } = (await keyRes.json()) as { publicKey: string };
    if (!publicKey) {
      setPushStatus("missing-vapid");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
    setPushStatus("ok");
  }

  async function saveReminderPrefs() {
    const childId = firstChildId || children[0]?.id;
    if (!childId) return;
    await fetch("/api/reminders/prefs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId,
        wakeRemind: true,
        sleepRemind: true,
        minutesBefore,
      }),
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!children?.length ? (
        <EmptyChildren onCta={openAdd} ctaLabel={t.addChild} />
      ) : (
        <section className="card space-y-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">{t.childrenSection}</h2>
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              {t.addChild}
            </button>
          </div>
          <ul className="space-y-2">
            {children.map((child) => (
              <li
                key={child.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-(--border) px-3 py-3"
              >
                <div>
                  <div className="font-semibold">{child.name}</div>
                  <div className="text-xs text-(--muted)">
                    {t.wake} {child.targetWakeTime} · {t.sleep} {child.targetSleepTime}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost px-3 py-1 text-sm" onClick={() => openEdit(child)}>
                    {t.editChild}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost px-3 py-1 text-sm"
                    onClick={() => removeChild(child.id)}
                  >
                    {t.delete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">{t.push}</h2>
        <p className="text-sm text-(--muted)">
          {t.installHint}{" "}
          <Link href="/help" className="font-semibold text-(--accent) underline-offset-2 hover:underline">
            {t.viewInstallGuide}
          </Link>
        </p>
        <button type="button" className="btn btn-primary" onClick={enablePush}>
          {t.enablePush}
        </button>
        {pushStatus ? <p className="text-sm text-(--muted)">{pushStatus}</p> : null}
        {children[0] ? (
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="label">{t.minutesBefore}</label>
              <input
                className="input"
                type="number"
                min={0}
                max={120}
                value={minutesBefore}
                onChange={(e) => setMinutesBefore(Number(e.target.value))}
              />
            </div>
            <button type="button" className="btn btn-ghost" onClick={saveReminderPrefs}>
              {t.save}
            </button>
          </div>
        ) : null}
      </section>

      <button type="button" className="btn btn-primary w-full" onClick={logout}>
        {t.logout}
      </button>

      <Modal open={addOpen} title={t.addChild} onClose={() => setAddOpen(false)}>
        <ChildForm
          t={t}
          name={name}
          wake={wake}
          sleep={sleep}
          setName={setName}
          setWake={setWake}
          setSleep={setSleep}
          saving={saving}
          onCancel={() => setAddOpen(false)}
          onSave={createChild}
        />
      </Modal>

      <Modal open={!!editChild} title={t.editChild} onClose={() => setEditChild(null)}>
        <ChildForm
          t={t}
          name={name}
          wake={wake}
          sleep={sleep}
          setName={setName}
          setWake={setWake}
          setSleep={setSleep}
          saving={saving}
          onCancel={() => setEditChild(null)}
          onSave={updateChild}
        />
      </Modal>
    </div>
  );
}

function ChildForm({
  t,
  name,
  wake,
  sleep,
  setName,
  setWake,
  setSleep,
  saving,
  onCancel,
  onSave,
}: {
  t: ReturnType<typeof useI18n>["t"];
  name: string;
  wake: string;
  sleep: string;
  setName: (v: string) => void;
  setWake: (v: string) => void;
  setSleep: (v: string) => void;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">{t.childName}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t.targetWake}</label>
          <TimePicker value={wake} onChange={setWake} />
        </div>
        <div>
          <label className="label">{t.targetSleep}</label>
          <TimePicker value={sleep} onChange={setSleep} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn btn-ghost flex-1" onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="button" className="btn btn-primary flex-1" disabled={saving || !name.trim()} onClick={onSave}>
          {t.save}
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
