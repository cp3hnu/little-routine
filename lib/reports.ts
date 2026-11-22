import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { periodReports } from "./db/schema";
import { newId } from "./crypto";
import { computePeriodMetrics, metricsHash } from "./metrics";
import { generateNarrative, type ReportNarrative } from "./qwen";
import type { PeriodMetrics } from "./metrics";
import { getEnv } from "./env";

export type PeriodReport = {
  metrics: PeriodMetrics;
  narrative: ReportNarrative;
  cached: boolean;
  model: string | null;
};

export async function getOrCreateReport(options: {
  childId: string;
  periodType: "month" | "year";
  periodKey: string;
  locale: string;
  force?: boolean;
}): Promise<PeriodReport> {
  const { childId, periodType, periodKey, locale, force } = options;
  const metrics = await computePeriodMetrics(childId, periodType, periodKey);
  const hash = await metricsHash(metrics);
  const db = await getDb();

  if (!force) {
    const [cached] = await db
      .select()
      .from(periodReports)
      .where(
        and(
          eq(periodReports.childId, childId),
          eq(periodReports.periodType, periodType),
          eq(periodReports.periodKey, periodKey),
          eq(periodReports.locale, locale),
        ),
      )
      .limit(1);

    if (cached && cached.metricsHash === hash) {
      return {
        metrics: JSON.parse(cached.metricsJson) as PeriodMetrics,
        narrative: JSON.parse(cached.narrativeJson) as ReportNarrative,
        cached: true,
        model: cached.model,
      };
    }
  }

  const narrative = await generateNarrative(metrics, locale);
  const model = narrative.source === "qwen" ? getEnv().QWEN_MODEL || "qwen-plus" : "fallback";

  await db
    .delete(periodReports)
    .where(
      and(
        eq(periodReports.childId, childId),
        eq(periodReports.periodType, periodType),
        eq(periodReports.periodKey, periodKey),
        eq(periodReports.locale, locale),
      ),
    );

  await db.insert(periodReports).values({
    id: newId(),
    childId,
    periodType,
    periodKey,
    locale,
    metricsJson: JSON.stringify(metrics),
    narrativeJson: JSON.stringify(narrative),
    model,
    metricsHash: hash,
  });

  return { metrics, narrative, cached: false, model };
}
