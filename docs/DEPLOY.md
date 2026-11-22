# Deploy to Cloudflare

## Prerequisites

- Cloudflare account
- Node 22+ recommended (cf CLI prefers recent Node)
- DashScope API key for 通义千问

## 1. Login

```bash
npx cf auth login
# or set CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
```

Optionally set `accountId` in `cloudflare.config.ts` top-level `defineConfig({ accountId: "..." })`.

## 2. Local secrets (`.dev.vars`)

```bash
cp .env.example .dev.vars
node scripts/generate-vapid.mjs   # copy printed keys into .dev.vars
```

Fill at least:

- `SESSION_SECRET`
- `QWEN_API_KEY`
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
- `CRON_SECRET`

## 3. Production secrets

After the first deploy (or with `--secrets-file`), set Worker secrets:

```bash
# Example pattern (see `cf workers secrets --help` for current CLI):
npx cf workers secrets update --worker little-routine --type secret_text
```

Required secrets:

| Name | Purpose |
|------|---------|
| `SESSION_SECRET` | Session signing / cookie sessions in KV |
| `QWEN_API_KEY` | DashScope / Qwen |
| `VAPID_PUBLIC_KEY` | Web Push |
| `VAPID_PRIVATE_KEY` | Web Push |
| `CRON_SECRET` | Protect `POST /api/cron/reminders` |

Plain text already in `cloudflare.config.ts`:

- `QWEN_MODEL` (default `qwen-plus`)
- `QWEN_BASE_URL`
- `VAPID_SUBJECT`

## 4. Build & deploy

```bash
npm run build
npm run deploy
```

Bindings (`DB` D1, `SESSION_KV`, `VINEXT_KV_CACHE`) are declared in `cloudflare.config.ts` and provisioned on deploy.

## 5. Cron

Worker trigger: every 10 minutes (`schedule: "*/10 * * * *"`) → `worker/index.ts` `scheduled` → push reminders + AI monthly summary on the last day of each month. Daily check-in stats are computed live from logs.

Manual:

```bash
curl -X POST https://<your-worker>/api/cron/reminders \
  -H "x-cron-secret: $CRON_SECRET"
```

## 6. Verify

1. Open the Worker URL
2. Register with phone + password
3. Add a child, log wake/sleep
4. Open Reports (with `QWEN_API_KEY` set for AI copy; otherwise rule-based fallback)
5. Settings → enable push (HTTPS / installed PWA required)
