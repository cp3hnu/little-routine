import type { Metadata, Viewport } from "next";
import { getSessionUser } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import type { Locale } from "@/lib/i18n/dictionaries";
import { SITE_NAME, SITE_NAME_ZH, SITE_URL, seoCopy } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME_ZH}`,
  },
  description: seoCopy.zh.description,
  applicationName: SITE_NAME_ZH,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME_ZH,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: seoCopy.zh.title,
    description: seoCopy.zh.description,
    url: SITE_URL,
    locale: seoCopy.zh.ogLocale,
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary",
    title: seoCopy.zh.title,
    description: seoCopy.zh.description,
    images: ["/icons/icon-512.png"],
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
