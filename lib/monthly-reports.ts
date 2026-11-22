import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import { children, families, users, familyMembers } from "./db/schema";
import { ensureSchema } from "./db";
import { getOrCreateReport } from "./reports";
import { localDateString } from "./time";

type Env = {
  DB: D1Database;
};

function isLastDayOfMonth(date: Date, timeZone: string): boolean {
  const local = localDateString(date, timeZone);
  const [y, m, d] = local.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d === last;
}

/** On the last calendar day (per family timezone), generate month reports for every child. */
export async function runMonthEndReports(env: Env) {
  await ensureSchema(env.DB);
  const db = drizzle(env.DB, { schema });
  const now = new Date();

  const rows = await db
    .select({
      child: children,
      family: families,
      locale: users.locale,
    })
    .from(children)
    .innerJoin(families, eq(families.id, children.familyId))
    .innerJoin(familyMembers, eq(familyMembers.familyId, families.id))
    .innerJoin(users, eq(users.id, familyMembers.userId));

  const seen = new Set<string>();

  for (const row of rows) {
    const tz = row.family.timezone || "Asia/Shanghai";
    if (!isLastDayOfMonth(now, tz)) continue;

    const periodKey = localDateString(now, tz).slice(0, 7);
    const locale = row.locale === "en" ? "en" : "zh";
    const key = `${row.child.id}:${periodKey}:${locale}`;
    if (seen.has(key)) continue;
    seen.add(key);

    try {
      await getOrCreateReport({
        childId: row.child.id,
        periodType: "month",
        periodKey,
        locale,
        force: false,
      });
    } catch (err) {
      console.error("month-end report failed", key, err);
    }
  }
}
