import type { Locale } from "@/lib/i18n/dictionaries";

export const landingCopy = {
  zh: {
    brand: "小小作息",
    brandEn: "Little Routine",
    langSwitch: "English",
    langHref: "/en",
    headline: "陪孩子养成健康作息",
    subhead: "起床睡觉一键打卡，月度统计与提醒帮全家把规律作息坚持下去。",
    ctaPrimary: "免费开始",
    ctaSecondary: "已有账号登录",
    featuresTitle: "家庭作息，简单可坚持",
    featuresLead: "为多小孩家庭设计，少操作、看得见进步。",
    features: [
      {
        title: "起床 / 睡觉打卡",
        body: "按当前时段一键记录，也能补卡，时间可手动调整。",
      },
      {
        title: "多小孩档案",
        body: "为每位孩子设置目标起床与睡觉时间，切换记录互不干扰。",
      },
      {
        title: "月度统计与 AI 建议",
        body: "看打卡天数、早起早睡率与连续天数，月末生成可读的月度报告。",
      },
      {
        title: "提醒与主屏安装",
        body: "目标时间前提醒，支持安装到手机主屏，像本地应用一样打开。",
      },
    ],
    stepsTitle: "三步开始",
    stepsLead: "注册家庭账号后即可记录。",
    steps: [
      { title: "创建家庭账号", body: "手机号注册，一分钟内完成。" },
      { title: "添加孩子与目标时间", body: "设定起床、睡觉目标，按孩子分别记录。" },
      { title: "每天轻轻打一次卡", body: "看统计、收提醒，慢慢养成节奏。" },
    ],
    footerNote: "小小作息 · 陪孩子把作息练成习惯",
  },
  en: {
    brand: "Little Routine",
    brandEn: "小小作息",
    langSwitch: "中文",
    langHref: "/",
    headline: "Healthier sleep habits for kids",
    subhead:
      "One-tap wake and sleep check-ins, monthly insights, and reminders so your family can keep a steady rhythm.",
    ctaPrimary: "Get started free",
    ctaSecondary: "Sign in",
    featuresTitle: "Built for real family routines",
    featuresLead: "Light to use, clear progress — made for households with one or more kids.",
    features: [
      {
        title: "Wake & sleep check-in",
        body: "Log the current period in one tap, or backfill with a custom time.",
      },
      {
        title: "Multiple children",
        body: "Set target wake and bedtime per child and switch profiles anytime.",
      },
      {
        title: "Monthly stats & AI tips",
        body: "See logged days, early-rise and early-sleep rates, streaks, and a month-end report.",
      },
      {
        title: "Reminders & home screen",
        body: "Get nudged before target times, and install as a PWA on your phone.",
      },
    ],
    stepsTitle: "Start in three steps",
    stepsLead: "Create a family account and begin logging today.",
    steps: [
      { title: "Create a family account", body: "Register with your phone number in about a minute." },
      { title: "Add kids & targets", body: "Set wake and sleep goals, then track each child separately." },
      { title: "Check in daily", body: "Review stats, get reminders, and build the habit gently." },
    ],
    footerNote: "Little Routine · steady habits, one check-in at a time",
  },
} as const;

export type LandingCopy = (typeof landingCopy)[Locale];

export function getLandingCopy(locale: Locale): LandingCopy {
  return landingCopy[locale];
}
