# Responsive nav, user menu, and install help

Date: 2026-11-27  
Status: approved for planning  
Approach: C (shadcn/Radix dropdown)

## Goal

1. Desktop (`md` and up): primary nav in the top bar; phone/small tablet (`< md`): keep the current bottom tab bar.
2. Top-right avatar menu with nickname + phone (display only), Help, and Log out.
3. Dedicated `/help` page with add-to-home-screen / install guide adapted from anki-words.
4. Registration gains a required nickname field; nickname is read-only after signup.

## Non-goals

- No `/account` profile page or “User info” menu item (info lives only in the dropdown header).
- No full shadcn design-system migration — only the dropdown (and minimal supporting primitives if required).
- No historical DB migration path for existing production users (project still in development; no legacy users). Settings page logout stays.

## Breakpoints (match anki-words)

| Viewport | Primary nav | Top bar extras |
|----------|-------------|----------------|
| `< md` (768px) | Fixed bottom tabs: Home / Stats / Settings | Logo, locale/theme toggles, avatar menu |
| `≥ md` | Links in top bar (same three routes) | Same toggles + avatar; bottom nav hidden |

Content padding: keep bottom safe padding only when bottom nav is visible (`pb-*` below `md`, normal padding at `md+`).

Marketing (`/`, `/en` logged out) and auth (`/login`, `/register`) shells unchanged.

`/help` uses the logged-in app shell but is **not** a primary nav item (reachable from the avatar menu only).

## Architecture

### Shell

Extend `components/app-shell.tsx`:

- Extract or inline top nav links (same `links` as today).
- Bottom nav: add `md:hidden` (and drop desktop-only bottom padding).
- Top nav: `hidden md:flex` next to the brand or in the header center/right cluster, matching anki-words layout spirit while keeping little-routine visual language (`brand-mark`, `header-toggle`, accent soft active states).
- Pass `user={{ nickname, phone }}` (or equivalent props) from `app/layout.tsx` when `getSessionUser()` succeeds; render `UserMenu` only when logged in (`showNav`).

### User menu (shadcn/Radix)

Dependencies (minimal):

- `@radix-ui/react-dropdown-menu`
- `lucide-react` for menu icons (optional but preferred for Help / Log out icons)
- Local `components/ui/dropdown-menu.tsx` styled with existing CSS variables (`--bg-elevated`, `--border`, `--muted`, `--accent`, etc.), not a wholesale theme rewrite
- Optional tiny helpers (`cn`, `Button` variant) only if needed for the trigger

`components/user-menu.tsx` (client):

- Trigger: circular control; avatar letter from first character of nickname (fallback: last digit of phone or a generic mark)
- Dropdown header (label, not a link): nickname + phone
- Items:
  1. Help → `Link` to `/help`
  2. Log out → `POST /api/auth/logout`, then `router.push("/login")` + `refresh()` (same behavior as settings)
- No “User info” row

Settings panel keeps its existing logout button (both entry points remain).

### Help page

- Route: `app/help/page.tsx` — require session; redirect to `/login` if missing; `noindex` like other private app routes.
- Content module: `lib/help-content.ts` — structure mirrored from anki-words (`INSTALL_GUIDES` for pc/phone/tablet, `IN_APP_BROWSER_WARNING`, `INSTALL_INTRO`, `INSTALL_TIPS`). Product name: 小小作息 / Little Routine. Strip vocabulary-learning copy; keep install-focused tips. Include one short tip that sleep reminders work best when the app is opened from the installed home-screen icon (link/point to Settings); do **not** port anki-words’ full notification FAQ section.
- UI: `components/install-guide.tsx` adapted from anki-words install guide (device jump links, warning callout, step lists). Prefer existing project patterns / lucide icons over pulling anki-words’ full design tokens.
- i18n: either bilingual strings inside `help-content` keyed by locale, or entries in `lib/i18n/dictionaries.ts` for page chrome (“Help”, “Add to home screen”) plus locale-aware content in the module. Prefer matching how the rest of the app localizes (dictionaries for chrome; structured content can be locale maps in `help-content.ts`).
- Settings `installHint`: keep the short hint; optionally link it to `/help`.

### Nickname + registration

Schema (`lib/db/schema.ts` + `SCHEMA_SQL` in `lib/db/index.ts`):

- Add `nickname TEXT NOT NULL` on `users` in `CREATE TABLE` for new DBs.
- Also add an idempotent `ALTER TABLE users ADD COLUMN nickname ...` in `SCHEMA_MIGRATIONS` so existing local/remote D1 tables pick up the column on next `ensureSchema` without manual Console work.

Auth / API:

- `registerUser({ phone, password, nickname, ... })` — trim; require length 1–32 characters after trim; reject empty.
- Register form + `POST /api/auth/register` accept `nickname`.
- `GET /api/me` returns `nickname` (and existing phone/prefs).
- Nickname is not editable via PATCH (read-only after register).

Avatar menu and any future display use `nickname` from session/layout or `/api/me`.

## Data flow

```text
layout getSessionUser()
  → AppShell(showNav, user: { nickname, phone })
    → UserMenu
        → /help (InstallGuide + help-content)
        → POST /api/auth/logout
register form → POST /api/auth/register { phone, password, nickname }
  → users.nickname stored
```

## Error handling

- Register: validate nickname server-side; return clear error codes/messages consistent with existing auth errors.
- Logout from menu: ignore network failure for UX only if settings already does; otherwise match settings (await then redirect).
- Help: unauthenticated → redirect login; no extra APIs.

## Testing (manual)

- `< md`: bottom tabs visible; top has no primary link row; avatar works.
- `≥ md`: bottom tabs hidden; top links work and show active state; content not clipped by phantom bottom padding.
- Menu shows nickname + phone; Help navigates; Log out clears session.
- Register requires nickname; login then menu shows it.
- Help install steps readable in zh and en; in-app browser warning present.
- Settings logout still works.

## File touch list (expected)

- `components/app-shell.tsx`
- `components/user-menu.tsx` (new)
- `components/ui/dropdown-menu.tsx` (new)
- `components/install-guide.tsx` (new)
- `components/auth-forms.tsx`
- `components/settings-panel.tsx` (optional help link)
- `app/layout.tsx`
- `app/help/page.tsx` (new)
- `lib/db/schema.ts`, `lib/db/index.ts`
- `lib/auth.ts`, `app/api/auth/register/route.ts`, `app/api/me/route.ts`
- `lib/help-content.ts` (new)
- `lib/i18n/dictionaries.ts`
- `package.json` / lockfile (Radix + lucide)

## Open decisions resolved

| Topic | Decision |
|-------|----------|
| Help UX | Dedicated `/help` page |
| User info | Display in dropdown only; no account page |
| Nickname after register | Read-only |
| Breakpoint | anki-words `md` |
| Settings logout | Keep both |
| UI library | Approach C — Radix dropdown via local shadcn-style component |
| DB upgrade | Direct schema/SQL update; no legacy migration |
