import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/dictionaries";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://sleep.cp3hnu.com"
);

export const SITE_NAME_ZH = "小小作息";
export const SITE_NAME_EN = "Little Routine";
export const SITE_NAME = `${SITE_NAME_ZH} | ${SITE_NAME_EN}`;

export type SeoLocale = Locale;

export const seoCopy = {
  zh: {
    title: "小小作息 — 陪孩子养成健康作息的家庭打卡",
    description:
      "记录孩子起床与睡觉时间，查看月度统计与 AI 建议，目标时间前提醒。多小孩家庭适用的作息打卡应用。",
    ogLocale: "zh_CN",
  },
  en: {
    title: "Little Routine — Family wake & sleep check-in for kids",
    description:
      "Track kids' wake and sleep times, see monthly stats and AI tips, and get reminders before target times. Built for families with one or more children.",
    ogLocale: "en_US",
  },
  login: {
    zh: {
      title: "登录",
      description: "登录小小作息，继续记录孩子的起床与睡觉打卡。",
    },
    en: {
      title: "Sign in",
      description: "Sign in to Little Routine to keep tracking wake and sleep check-ins.",
    },
  },
  register: {
    zh: {
      title: "注册",
      description: "注册小小作息家庭账号，开始陪孩子养成健康作息。",
    },
    en: {
      title: "Create account",
      description: "Create a Little Routine family account and start healthier sleep habits.",
    },
  },
} as const;

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized === "/" ? "" : normalized}` || SITE_URL;
}

export function landingAlternates(locale: SeoLocale): Metadata["alternates"] {
  return {
    canonical: locale === "zh" ? "/" : "/en",
    languages: {
      "zh-CN": "/",
      en: "/en",
      "x-default": "/",
    },
  };
}

export function landingMetadata(locale: SeoLocale): Metadata {
  const copy = seoCopy[locale];
  const path = locale === "zh" ? "/" : "/en";
  return {
    title: { absolute: copy.title },
    description: copy.description,
    alternates: landingAlternates(locale),
    openGraph: {
      type: "website",
      url: absoluteUrl(path),
      title: copy.title,
      description: copy.description,
      siteName: SITE_NAME,
      locale: copy.ogLocale,
      alternateLocale: locale === "zh" ? ["en_US"] : ["zh_CN"],
      images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary",
      title: copy.title,
      description: copy.description,
      images: ["/icons/icon-512.png"],
    },
  };
}

export function authPageMetadata(kind: "login" | "register", locale: SeoLocale = "zh"): Metadata {
  const copy = seoCopy[kind][locale];
  const path = kind === "login" ? "/login" : "/register";
  const title = `${copy.title} · ${SITE_NAME_ZH}`;
  return {
    title,
    description: copy.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: absoluteUrl(path),
      title,
      description: copy.description,
      siteName: SITE_NAME,
      images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: SITE_NAME }],
    },
  };
}

export function noIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export function buildWebAppJsonLd(locale: SeoLocale) {
  const copy = seoCopy[locale];
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: locale === "zh" ? SITE_NAME_ZH : SITE_NAME_EN,
    alternateName: locale === "zh" ? SITE_NAME_EN : SITE_NAME_ZH,
    url: SITE_URL,
    description: copy.description,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
    },
  };
}
