import { getEnv } from "./env";
import type { PeriodMetrics } from "./metrics";

export type ReportNarrative = {
  title: string;
  summary: string;
  highlights: string[];
  suggestions: string[];
  encouragement: string;
  source: "qwen" | "fallback";
};

function fallbackNarrative(metrics: PeriodMetrics, locale: string): ReportNarrative {
  const zh = locale !== "en";
  const periodLabel =
    metrics.periodType === "month"
      ? zh
        ? `${metrics.periodKey} 月总结`
        : `Month ${metrics.periodKey}`
      : zh
        ? `${metrics.periodKey} 年总结`
        : `Year ${metrics.periodKey}`;

  const highlights: string[] = [];
  if (metrics.wakeRate >= 80) {
    highlights.push(zh ? `早起达标率 ${metrics.wakeRate}%，非常稳定。` : `Wake success rate ${metrics.wakeRate}% — solid.`);
  } else {
    highlights.push(zh ? `早起达标率 ${metrics.wakeRate}%，还有提升空间。` : `Wake success rate ${metrics.wakeRate}% — room to grow.`);
  }
  if (metrics.longestWakeStreak >= 3) {
    highlights.push(
      zh
        ? `最长连续早起 ${metrics.longestWakeStreak} 天。`
        : `Longest early-wake streak: ${metrics.longestWakeStreak} days.`,
    );
  }
  if (metrics.prevWakeRate != null) {
    const delta = metrics.wakeRate - metrics.prevWakeRate;
    highlights.push(
      zh
        ? `相比上月早起率 ${delta >= 0 ? "提升" : "变化"} ${Math.abs(delta)}%。`
        : `Wake rate changed by ${delta}% vs last month.`,
    );
  }

  const suggestions: string[] = [];
  if (metrics.sleepRate < 70) {
    suggestions.push(
      zh
        ? "睡前 30–60 分钟关掉屏幕，提前洗漱、调暗灯光，按目标时间慢慢入睡。"
        : "Dim screens 30–60 minutes before bed, finish wind-down early, and ease into the target bedtime.",
    );
    suggestions.push(
      zh
        ? "对照中小学生睡眠建议核对目标：小学约 21:00、初中约 21:30、高中约 22:00 就寝。"
        : "Check bedtime against school guidelines: ~21:00 (primary), ~21:30 (middle), ~22:00 (high school).",
    );
  }
  if (metrics.wakeRate < 70) {
    suggestions.push(
      zh
        ? "起床后先拉开窗帘、喝杯温水，用固定小仪式帮助准时起床。"
        : "Open curtains and drink water right after waking to anchor an on-time morning ritual.",
    );
  }
  if (metrics.avgSleepMinutes != null && metrics.avgSleepMinutes < 8 * 60) {
    suggestions.push(
      zh
        ? "近期平均睡眠偏少，优先保证连续睡眠时长，再微调起床或睡觉目标。"
        : "Average sleep looks short — protect continuous sleep hours before tightening wake/bed targets.",
    );
  }
  if (!suggestions.length) {
    suggestions.push(
      zh
        ? "继续保持当前节奏；周末作息波动尽量控制在 1 小时以内。"
        : "Keep the current rhythm; try to keep weekend drift within about an hour.",
    );
    suggestions.push(
      zh
        ? "可定期对照推荐作息：小学 ≥10 小时、初中 ≥9 小时、高中 ≥8 小时睡眠。"
        : "Revisit the guide: primary ≥10h, middle ≥9h, high school ≥8h of sleep.",
    );
  }

  return {
    title: `${metrics.childName} · ${periodLabel}`,
    summary: zh
      ? `本周期打卡 ${metrics.loggedDays} 天，早起达标 ${metrics.wakeSuccessDays} 天，早睡达标 ${metrics.sleepSuccessDays} 天。`
      : `Logged ${metrics.loggedDays} days: ${metrics.wakeSuccessDays} early wakes, ${metrics.sleepSuccessDays} early bedtimes.`,
    highlights,
    suggestions,
    encouragement: zh
      ? "规律作息是给身体的礼物，一步一步就会看见变化。"
      : "A steady routine is a gift to the body — small steps add up.",
    source: "fallback",
  };
}

function extractJson(text: string): ReportNarrative | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Partial<ReportNarrative>;
    if (!parsed.title || !parsed.summary || !Array.isArray(parsed.highlights)) return null;
    return {
      title: String(parsed.title),
      summary: String(parsed.summary),
      highlights: parsed.highlights.map(String).slice(0, 5),
      suggestions: (parsed.suggestions ?? []).map(String).slice(0, 5),
      encouragement: String(parsed.encouragement ?? ""),
      source: "qwen",
    };
  } catch {
    return null;
  }
}

export async function generateNarrative(
  metrics: PeriodMetrics,
  locale: string,
): Promise<ReportNarrative> {
  const env = getEnv();
  const fallback = fallbackNarrative(metrics, locale);
  if (!env.QWEN_API_KEY) return fallback;

  const lang = locale === "en" ? "English" : "Simplified Chinese";
  const system = `You are a warm parenting coach writing sleep routine reports for children.
Only use the provided metrics. Never invent numbers.
Return ONLY valid JSON with keys: title, summary, highlights (array), suggestions (array), encouragement.
Write in ${lang}. Keep tone encouraging and age-appropriate for parents reading with kids.
Suggestions should be practical (2-4 items): bedtime wind-down, morning rituals, weekend consistency.
When helpful, briefly reference school sleep guidelines (primary ≥10h / ~21:00 bed; middle ≥9h / ~21:30; high school ≥8h / ~22:00).`;

  try {
    const res = await fetch(`${env.QWEN_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.QWEN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.QWEN_MODEL || "qwen-plus",
        temperature: 0.6,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Metrics JSON:\n${JSON.stringify(metrics, null, 2)}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Qwen error", await res.text());
      return fallback;
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    return extractJson(content) ?? fallback;
  } catch (err) {
    console.error("Qwen request failed", err);
    return fallback;
  }
}
