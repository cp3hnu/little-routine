import type { Metadata, Viewport } from "next";
import { getSessionUser } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import type { Locale } from "@/lib/i18n/dictionaries";
import "./globals.css";

export const metadata: Metadata = {
  title: "小小作息 | Little Routine",
  description: "Track kids wake and sleep times with monthly and yearly AI reports",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "小小作息",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efe7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#100a18" },
  ],
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser().catch(() => null);
  const locale = (user?.locale === "en" ? "en" : "zh") as Locale;
  const theme = user?.theme === "dark" ? "dark" : "light";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            <PwaRegister />
            <AppShell showNav={!!user} initialTheme={theme}>
              {children}
            </AppShell>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
