# SEO + Public Landing Design

**Site:** `https://sleep.cp3hnu.com`  
**Approach:** Technical SEO foundation + bilingual public landing (Approach 1)  
**Date:** 2026-11-23

## Goals

1. Make the product discoverable and shareable with correct metadata, crawl rules, and structured data.
2. Give unauthenticated visitors a bilingual marketing landing page that converts to register/login.
3. Keep authenticated app routes private (`noindex`) and behavior unchanged for logged-in users.

## Routing & indexability

| URL | Audience | Index |
|-----|----------|-------|
| `/` | Logged out → ZH landing; logged in → check-in home | Yes (landing content when public) |
| `/en` | EN landing only | Yes |
| `/login`, `/register` | Auth | Yes (lower sitemap priority) |
| `/stats`, `/settings`, `/children`, `/reports` | Logged-in only | `noindex` |
| `/api/*` | APIs | Disallow in robots |

### Behavior rules

- Unauthenticated `/` renders Chinese landing (no redirect to `/login`).
- Authenticated `/` keeps existing home check-in.
- Authenticated `/en` redirects to `/`.
- Landing language switch is path-based: `/` ↔ `/en`.
- In-app locale toggle stays session/API based; unrelated to SEO paths.
- Landing CTAs: primary → `/register`, secondary → `/login`.

## Technical SEO

### Site config (`lib/seo.ts`)

- `SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sleep.cp3hnu.com"`
- Shared copy helpers for ZH/EN titles, descriptions, OG locale.
- JSON-LD builder for `WebApplication` (name, url, description, applicationCategory, inLanguage, offers free).

### Root metadata (`app/layout.tsx`)

- `metadataBase: new URL(SITE_URL)`
- Default title template: `%s | 小小作息` / brand-aware default
- Open Graph + Twitter card defaults (type website, site name, images)
- Icons / appleWebApp / manifest unchanged

### Per-route metadata

- Landing ZH/EN: unique title (~50–60 chars), description (~120–160), canonical, `alternates.languages` (`zh-CN` → `/`, `en` → `/en`), OG locale
- Login / register: page-specific title + description; canonical self
- Stats / settings: `robots: { index: false, follow: false }`

### Crawl files

- `app/robots.ts` → Allow public paths; Disallow `/api/`, `/stats`, `/settings`, `/children`, `/reports`; sitemap URL
- `app/sitemap.ts` → `/`, `/en`, `/login`, `/register` with priorities (landing highest)

### Structured data

- Inject JSON-LD on landing pages only (`WebApplication` + optional `Organization` with name/url)
- Match visible claims; no fake ratings

### Open Graph image

- Use existing `/icons/icon-512.png` as default OG image unless a dedicated `public/og.png` is added later
- Absolute URLs via `metadataBase`

## Landing page content & UI

### Structure (one job per section)

1. **Hero:** Brand「小小作息 / Little Routine」dominant; one headline; one supporting line; CTA group (register + login); soft night/morning atmosphere using existing CSS tokens (no new purple-on-white template; reuse app palette)
2. **Features:** wake/sleep check-in, multi-child, monthly stats + AI report, push reminders / PWA — short copy, no card grid clutter beyond interaction needs
3. **How it works:** 3 short steps
4. **Footer:** language link, privacy-light note if needed, brand

### i18n

- Landing strings in `lib/i18n/landing.ts` (or dictionaries extension) for `zh` / `en`
- Landing shell does not use bottom app nav; `AppShell` treats `/` (logged out) and `/en` like marketing/auth surfaces (no bottom nav)

### Visual constraints

- Preserve existing design tokens from `globals.css`
- Mobile-first; respect `prefers-reduced-motion`
- At least 2–3 subtle motions (hero fade/rise, soft ambient, CTA hover) scoped under landing classes

## Auth / shell impact

- `app/page.tsx`: if no session → `<LandingPage locale="zh" />`; else existing check-in
- `app/en/page.tsx`: static EN landing; redirect if session
- `components/app-shell.tsx`: detect landing paths (`/` without nav already when `!user`; `/en` as marketing shell without bottom nav; language toggle on landing links to alternate path instead of API when on marketing pages)
- Login/register remain as today; unauthenticated deep links to `/stats` still redirect `/login`

## Out of scope

- Full app locale path prefixes (`/zh/stats`, etc.)
- Blog / content hub
- Custom OG image generator
- Search Console verification tokens (add later via env if needed)

## Success criteria

- View-source on `/` and `/en` shows unique title, description, canonical, hreflang, OG tags, JSON-LD
- `/robots.txt` and `/sitemap.xml` resolve with correct public URLs
- Logged-in home behavior unchanged
- Logged-out `/` shows landing with register CTA
- Private routes send `noindex`
