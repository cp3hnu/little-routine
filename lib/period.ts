/** Wake: 05:00–12:00; Sleep: 18:00–23:59; otherwise none */
export type CheckinMode = "wake" | "sleep" | "none";

export function minutesOfDay(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isWakeWindow(now = new Date()): boolean {
  const m = minutesOfDay(now);
  return m >= 5 * 60 && m < 12 * 60;
}

export function isSleepWindow(now = new Date()): boolean {
  const m = minutesOfDay(now);
  return m >= 18 * 60 && m <= 23 * 60 + 59;
}

export function getCheckinMode(now = new Date()): CheckinMode {
  if (isWakeWindow(now)) return "wake";
  if (isSleepWindow(now)) return "sleep";
  return "none";
}

export function formatHm(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatHms(date = new Date()): string {
  return `${formatHm(date)}:${String(date.getSeconds()).padStart(2, "0")}`;
}

export function todayLocal(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDaysLocal(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return todayLocal(d);
}

/** Wake and sleep both belong to the calendar day. */
export function wakeLogDate(now = new Date()): string {
  return todayLocal(now);
}

export function sleepLogDate(now = new Date()): string {
  return todayLocal(now);
}

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
