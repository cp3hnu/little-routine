"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useI18n } from "./locale-provider";
import type { Locale } from "@/lib/i18n/dictionaries";

const links = [
  { href: "/", key: "home" as const },
  { href: "/stats", key: "stats" as const },
  { href: "/settings", key: "settings" as const },
];

export function AppShell({
  children,
  showNav,
  initialTheme,
}: {
  children: React.ReactNode;
  showNav: boolean;
  initialTheme?: string;
}) {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isAuth = pathname === "/login" || pathname === "/register";

  useEffect(() => setMounted(true), []);

  async function persist(nextLocale?: Locale, nextTheme?: string) {
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: nextLocale ?? locale,
        theme: nextTheme ?? (isDark ? "dark" : "light"),
      }),
    }).catch(() => undefined);
  }

  const isDark = mounted
    ? (resolvedTheme || initialTheme) === "dark"
    : initialTheme === "dark";

  function toggleLocale() {
    const next: Locale = locale === "zh" ? "en" : "zh";
    setLocale(next);
    void persist(next);
  }

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    void persist(undefined, next);
  }

  const toggles = (
    <div className="flex shrink-0 items-center gap-2">
      <button type="button" className="header-toggle" onClick={toggleLocale} aria-label={t.language}>
        {locale === "zh" ? "中文" : "EN"}
      </button>
      <button type="button" className="header-toggle" onClick={toggleTheme} aria-label={t.theme}>
        {isDark ? "☾" : "☀"}
      </button>
    </div>
  );

  if (isAuth) {
    return (
      <div className="auth-shell">
        <div className="auth-shell-toggles">{toggles}</div>
        <main className="auth-shell-main">{children}</main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-28 pt-4">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tracking-tight">{t.appName}</p>
        </div>
        {toggles}
      </header>

      <main className="flex-1">{children}</main>

      {showNav ? (
        <nav className="fixed inset-x-0 bottom-0 border-t border-(--border) bg-[color-mix(in_oklab,var(--bg-elevated)_90%,transparent)] backdrop-blur-md">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-1 px-3 py-2">
            {links.map((link) => {
              const active =
                pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-2 py-2.5 text-center text-sm font-semibold ${
                    active ? "bg-(--accent-soft) text-(--accent)" : "text-(--muted)"
                  }`}
                >
                  {t[link.key]}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
