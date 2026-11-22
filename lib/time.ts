/** Format a Date in a given IANA timezone as YYYY-MM-DD */
export function localDateString(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** HH:mm in timezone */
export function localTimeString(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function minutesFromHhMm(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function compareTime(actual: string, target: string): number {
  return minutesFromHhMm(actual) - minutesFromHhMm(target);
}

export function monthBounds(periodKey: string): { start: string; end: string } {
  const [y, m] = periodKey.split("-").map(Number);
  const start = `${periodKey}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const end = `${periodKey}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function yearBounds(year: string): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function prevMonthKey(periodKey: string): string {
  const [y, m] = periodKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
