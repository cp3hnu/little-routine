# Responsive Nav, User Menu & Help Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desktop top nav (`md+`), mobile bottom nav, Radix avatar menu (nickname/phone + help + logout), `/help` install guide, and required nickname on register.

**Architecture:** Extend `AppShell` with responsive nav; add shadcn-style `DropdownMenu` + `UserMenu`; new `/help` + `help-content`/`InstallGuide`; add `users.nickname` through schema, auth, register API/UI, and `/api/me`.

**Tech Stack:** Vinext/React, Tailwind v4, Drizzle+D1, `@radix-ui/react-dropdown-menu`, `lucide-react`, existing i18n dictionaries.

## Global Constraints

- Breakpoint: `md` (768px) — bottom nav `md:hidden`, top nav `hidden md:flex` (match anki-words).
- User info: display nickname + phone in dropdown header only; no `/account` page.
- Nickname: required on register (1–32 chars after trim); read-only after; no PATCH.
- Help: dedicated `/help` (auth required); install guide adapted from anki-words with 小小作息 / Little Routine naming; no full notification FAQ.
- Settings logout stays; avatar menu also logs out.
- Approach C: local shadcn-style dropdown only — no full design-system migration.
- No legacy DB migration path in code; document remote `ALTER` for Cloudflare D1.
- Product names: 小小作息 / Little Routine.
- Do not commit unless the user asks (repo preference).

## File map

| File | Responsibility |
|------|----------------|
| `lib/db/schema.ts`, `lib/db/index.ts` | `nickname` column |
| `lib/auth.ts`, `app/api/auth/register/route.ts`, `app/api/me/route.ts` | register + expose nickname |
| `lib/i18n/dictionaries.ts` | nickname, help, accountMenu labels |
| `components/auth-forms.tsx` | nickname field on register |
| `lib/utils.ts` | `cn()` helper |
| `components/ui/dropdown-menu.tsx` | Radix dropdown styled to project tokens |
| `components/user-menu.tsx` | Avatar trigger + menu |
| `components/app-shell.tsx`, `app/layout.tsx` | Responsive nav + pass user |
| `lib/help-content.ts`, `components/install-guide.tsx`, `app/help/page.tsx` | Help page |
| `components/settings-panel.tsx` | Link install hint to `/help` |

---

### Task 1: Nickname schema + auth + register UI + `/api/me`

**Files:**
- Modify: `lib/db/schema.ts`, `lib/db/index.ts`, `lib/auth.ts`, `app/api/auth/register/route.ts`, `app/api/me/route.ts`, `lib/i18n/dictionaries.ts`, `components/auth-forms.tsx`

**Interfaces:**
- Produces: `User.nickname: string`; `registerUser({ phone, password, nickname, familyName?, locale? })`; `GET /api/me` includes `nickname`

- [ ] **Step 1:** Add `nickname` to drizzle `users` and `SCHEMA_SQL` (`nickname TEXT NOT NULL`).

- [ ] **Step 2:** Update `registerUser` to validate nickname (trim, length 1–32, else `INVALID_NICKNAME`) and insert it.

- [ ] **Step 3:** Register route accepts `nickname`; require it with phone/password.

- [ ] **Step 4:** `GET /api/me` returns `nickname`.

- [ ] **Step 5:** Dictionaries: `nickname`, `nicknamePlaceholder`, `invalidNickname` (zh+en).

- [ ] **Step 6:** Register form: nickname field before phone; send in POST body.

- [ ] **Step 7:** Manual check — register without nickname fails; with nickname succeeds. Local D1: recreate or `ALTER` if table already exists.

---

### Task 2: `cn` + Radix dropdown + `UserMenu`

**Files:**
- Create: `lib/utils.ts`, `components/ui/dropdown-menu.tsx`, `components/user-menu.tsx`
- Modify: `package.json` (install `@radix-ui/react-dropdown-menu`, `lucide-react`, `clsx`, `tailwind-merge`)

**Interfaces:**
- Consumes: nickname, phone strings
- Produces: `<UserMenu nickname={string} phone={string} />`

- [ ] **Step 1:** `npm i @radix-ui/react-dropdown-menu lucide-react clsx tailwind-merge`

- [ ] **Step 2:** Add `cn(...inputs)` in `lib/utils.ts`.

- [ ] **Step 3:** Port a minimal `dropdown-menu.tsx` using project CSS vars (`--bg-elevated`, `--border`, `--ink`, `--muted`, `--accent-soft`).

- [ ] **Step 4:** Implement `UserMenu`: avatar letter from nickname; header shows nickname + phone; items Help → `/help`, Log out → `POST /api/auth/logout` then login redirect. Use dictionary keys `help`, `accountMenu` (aria).

---

### Task 3: Responsive `AppShell` + layout user props

**Files:**
- Modify: `components/app-shell.tsx`, `app/layout.tsx`, `lib/i18n/dictionaries.ts` (if needed)

**Interfaces:**
- Consumes: `UserMenu`; `user?: { nickname: string; phone: string } | null`
- Produces: responsive shell

- [ ] **Step 1:** Layout passes `user={user ? { nickname: user.nickname, phone: user.phone } : null}` into `AppShell`.

- [ ] **Step 2:** App shell: top nav links `hidden md:flex`; bottom nav `md:hidden`; shell padding `pb-28 md:pb-4` when `showNav`; header right: toggles + `UserMenu` when user present.

- [ ] **Step 3:** Manual: resize below/above 768px; verify nav placement and avatar.

---

### Task 4: Help content + InstallGuide + `/help` + settings link

**Files:**
- Create: `lib/help-content.ts`, `components/install-guide.tsx`, `app/help/page.tsx`
- Modify: `components/settings-panel.tsx`, `lib/i18n/dictionaries.ts`

**Interfaces:**
- Consumes: locale via `useI18n` or server locale
- Produces: authenticated `/help` page

- [ ] **Step 1:** `help-content.ts` with zh+en (or locale-keyed) install guides for 小小作息 / Little Routine; include in-app browser warning, pc/phone/tablet methods, install tips including reminder tip pointing to Settings. No full notification FAQ.

- [ ] **Step 2:** `InstallGuide` component (device jump links, warning, steps) using project card/styles + lucide icons.

- [ ] **Step 3:** `app/help/page.tsx` — session gate, `noIndexMetadata`, render guide.

- [ ] **Step 4:** Settings `installHint` becomes a link to `/help`.

- [ ] **Step 5:** Manual: open Help from menu; skim zh/en; confirm settings link.

---

### Task 5: Docs note for Cloudflare D1 ALTER

**Files:**
- Modify: `docs/DEPLOY.md` (short section) and/or design spec note

- [ ] **Step 1:** Document remote:
  `ALTER TABLE users ADD COLUMN nickname TEXT NOT NULL DEFAULT '';`
  via Dashboard Console or `wrangler d1 execute` / `cf d1 query`.

---

## Spec coverage checklist

- [x] md breakpoint responsive nav
- [x] Avatar menu: nickname+phone display, help, logout
- [x] No account page
- [x] `/help` install guide
- [x] Nickname on register, read-only after
- [x] Settings logout kept
- [x] Radix dropdown (approach C)
- [x] Cloudflare ALTER documented
