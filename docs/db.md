# 数据库说明（Cloudflare D1）

业务数据在 **Cloudflare D1**（SQLite），Worker 绑定名：`DB`（`cloudflare.config.ts`）。

| 文件 | 作用 |
|------|------|
| `lib/db/schema.ts` | Drizzle 表结构 |
| `lib/db/index.ts` | `SCHEMA_SQL`（建表）+ `SCHEMA_MIGRATIONS`（给已有表加列）+ `ensureSchema()` |

请求读库前会跑 `ensureSchema()`：先 `CREATE TABLE IF NOT EXISTS …`，再执行 `SCHEMA_MIGRATIONS`。  
**注意：** `CREATE TABLE IF NOT EXISTS` 不会给已有表加列；线上老库要靠迁移或手动 `ALTER`。

---

## 改 Schema 的代码流程（上线前）

1. 改 `lib/db/schema.ts`
2. 同步改 `SCHEMA_SQL`（新库建表）
3. 给**已有线上表**加列时，在 `SCHEMA_MIGRATIONS` 追加幂等 SQL，例如：

```ts
const SCHEMA_MIGRATIONS = [
  `ALTER TABLE users ADD COLUMN nickname TEXT NOT NULL DEFAULT ''`,
];
```

4. 部署新代码。部署后首次打到 D1 的请求会跑迁移；列已存在时 `ALTER` 失败会被忽略。

---

## 线上（远程 D1）怎么操作

本地 `.cloudflare/state` **不会**影响线上。线上改库用下面几种方式。

### 1. 靠代码自动迁移（优先）

把带 `SCHEMA_MIGRATIONS` 的版本部署上去，访问一次站点即可。一般加列够用。

### 2. Dashboard Console（适合临时 SQL）

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **little-routine**
2. **Settings** → **Bindings** → 点开 `DB`（D1）
3. 进入 **Console**，执行 SQL，例如：

```sql
-- 看表结构
PRAGMA table_info(users);

-- 加列
ALTER TABLE users ADD COLUMN nickname TEXT NOT NULL DEFAULT '';

-- 查数据
SELECT id, phone, nickname FROM users LIMIT 20;
```

### 3. Wrangler / cf CLI（适合脚本）

先登录：`npx cf auth login`（或已配置的 Wrangler 登录）。

```bash
# 列出远程库，记下名称或 UUID
npx wrangler d1 list
# 或
npx cf d1 list
```

对**远程**执行：

```bash
# Wrangler（常用）
npx wrangler d1 execute <数据库名> --remote --command "PRAGMA table_info(users);"
npx wrangler d1 execute <数据库名> --remote --command "ALTER TABLE users ADD COLUMN nickname TEXT NOT NULL DEFAULT '';"

# cf CLI（用 database id）
npx cf d1 query <database-id> --sql "PRAGMA table_info(users);"
npx cf d1 query <database-id> --sql "ALTER TABLE users ADD COLUMN nickname TEXT NOT NULL DEFAULT '';"
```

### 线上注意

- **加列**相对安全；`DROP TABLE` / 清空数据会丢生产数据，勿随意执行。
- 开发期若可接受清空线上数据，可在 Dashboard 删表后让新部署的 `SCHEMA_SQL` 重建——**有真实用户时不要这么做**。
- 部署与 Secrets 见 [DEPLOY.md](./DEPLOY.md)。

---

## 本地：直接删除重建

开发期本地库有问题、或缺列时，**不要纠结手动 ALTER**，删掉重建即可：

```bash
# 先停掉 npm run dev
rm -rf .cloudflare/state/v3/d1
npm run dev
```

下次请求会按最新 `SCHEMA_SQL` 建表。会丢掉本地用户、打卡等数据。

连会话一起清（可选）：

```bash
rm -rf .cloudflare/state/v3/kv
```

本地文件在 `.cloudflare/state/v3/d1/`（已 gitignore），与线上无关。

---

## 当前主要表

| 表 | 用途 |
|----|------|
| `users` | 账号（手机号、昵称、密码哈希、语言、主题） |
| `families` / `family_members` | 家庭与成员 |
| `children` | 小孩与目标起床/睡觉时间 |
| `sleep_logs` | 每日起床/睡觉打卡 |
| `push_subscriptions` / `reminder_prefs` | Web 推送与提醒偏好 |
| `period_reports` | 月度 AI 报告缓存 |

完整字段以 `lib/db/schema.ts` 为准。本项目不走 `drizzle-kit migrate`，以 `ensureSchema` + `SCHEMA_MIGRATIONS` 为准。
