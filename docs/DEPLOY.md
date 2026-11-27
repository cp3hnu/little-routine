# 部署到 Cloudflare Workers

本项目基于 **vinext + Cloudflare Workers**（不是 Vercel / Pages 默认流水线）。  
代码已推到 GitHub 后，**日常更新**用「GitHub → Cloudflare」自动部署最省事；但**第一次上线**建议先在本机用 CLI 完成登录、密钥与首次发布，再接 GitHub 自动部署。

## 先回答：从 GitHub 部署是不是最快？

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| **第一次上线** | 本机 `cf auth login` + `npm run deploy` | 要创建 Worker、配 Secrets、确认绑定（D1 / KV），本机交互最快、最好排错 |
| **之后每次改代码** | GitHub 推送触发 Cloudflare Workers Builds（或 GitHub Actions） | 推 `main` 即部署，无需每次本机操作 |

结论：

1. **最快完成「第一次能访问」**：本机 CLI（下文「路径 A」）。
2. **最快完成「以后改完就上线」**：代码在 GitHub 后，在 Cloudflare 控制台接上仓库（下文「路径 B」）。
3. 不要指望 Cloudflare 控制台默认的 `npx wrangler deploy`——本项目用的是 `cloudflare.config.ts` + `vinext-cloudflare deploy`，必须改 Deploy 命令。

---

## 你需要准备什么

1. **Cloudflare 账号**：https://dash.cloudflare.com  
2. **本机环境**：Node.js **22+**（推荐 22 / 24），已安装依赖：
   ```bash
   npm install
   ```
3. **通义千问（DashScope）API Key**（月度 AI 报告用；没有也能跑，会走规则文案兜底）  
   获取：https://dashscope.console.aliyun.com/
4. **GitHub 仓库**（路径 B 需要）：代码已 push，且你有该仓库权限
5. （可选）自定义域名，例如 `sleep.cp3hnu.com`（与 `.env.example` 里 `NEXT_PUBLIC_SITE_URL` 一致）

Worker 名称以 `cloudflare.config.ts` 为准，当前为：**`little-routine`**。

---

## 路径 A：本机首次部署（推荐先做）

### 第 1 步：登录 Cloudflare

在项目根目录执行：

```bash
npx cf auth login
```

浏览器打开后授权即可。

若在 CI / 无浏览器环境，可改用 API Token：

1. 打开 Cloudflare Dashboard → **My Profile** → **API Tokens** → Create Token  
2. 权限至少覆盖：Workers 编辑、D1、KV、账号读（可用 Workers 相关模板后按需收紧）  
3. 本机或 CI 设置环境变量：
   ```bash
   export CLOUDFLARE_API_TOKEN="你的_token"
   export CLOUDFLARE_ACCOUNT_ID="你的_account_id"
   ```
   Account ID 在 Dashboard 右侧概览或任意域名概览页可见。

可选：在 `cloudflare.config.ts` 顶层 `defineConfig({ accountId: "..." })` 写死账号 ID（不要把 Token 写进仓库）。

### 第 2 步：生成本地密钥文件

本地开发用 `.dev.vars`（已在 `.gitignore`，勿提交）：

```bash
cp .env.example .dev.vars
npm run vapid
```

`npm run vapid` 会打印两行类似：

```text
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

把它们粘贴进 `.dev.vars`，并补全其余项：

| 变量 | 说明 | 怎么填 |
|------|------|--------|
| `NEXT_PUBLIC_SITE_URL` | 站点正式 URL（无末尾 `/`） | 如 `https://sleep.cp3hnu.com`；没有自定义域可先用 Worker 默认域名，部署后再改并重新构建部署 |
| `SESSION_SECRET` | 会话签名 | 长随机串，例如 `openssl rand -hex 32` |
| `QWEN_API_KEY` | 通义 API Key | DashScope 控制台复制；暂无可用占位，报告走兜底 |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push | 上一步 `npm run vapid` 输出 |
| `VAPID_SUBJECT` | Push 联系人 | 如 `mailto:你的邮箱@example.com`（生产明文也可在 `cloudflare.config.ts` 的 `bindings.text`） |
| `CRON_SECRET` | 保护定时提醒接口 | 另一段长随机串，`openssl rand -hex 32` |

`QWEN_MODEL`、`QWEN_BASE_URL` 已在 `cloudflare.config.ts` 里用明文绑定写好，一般不必再改。

### 第 3 步：准备生产 Secrets（首次部署必做）

`cloudflare.config.ts` 里声明了这些 **secret**（没有值时首次部署会失败）：

- `SESSION_SECRET`
- `QWEN_API_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `CRON_SECRET`

**鸡生蛋问题**：Secret 只能挂在「已存在的 Worker」上；Worker 又要在部署时带上 Secret。  
因此**第一次**请用「密钥文件」一并部署。

从 `.dev.vars` 复制一份仅含生产密钥的文件（勿提交 Git），例如 `secrets.env`：

```bash
# 示例：只保留生产 secrets（值请换成真实内容）
SESSION_SECRET=...
QWEN_API_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
CRON_SECRET=...
```

然后构建并用密钥文件部署：

```bash
npm run build
npx cf deploy --prebuilt --mode production --secrets-file ./secrets.env
```

若你更习惯一键脚本，也可先试：

```bash
npm run deploy
```

（即 `vinext-cloudflare deploy`：会校验配置、构建并部署。）  
若报错提示缺少 secret，改用上面的 `cf deploy --prebuilt ... --secrets-file`。

部署成功后，控制台会给出 Worker URL，形如：

`https://little-routine.<你的子域>.workers.dev`

**部署后请删除本机 `secrets.env`，或确保它在 `.gitignore` 中，切勿 push。**

### 第 4 步：后续更新 Secret（可选）

Worker 已存在后，可单独更新某个 secret：

```bash
npx cf workers secrets update --worker little-routine --type secret_text
```

按提示选择名称并粘贴新值。也可在 Dashboard：

**Workers & Pages** → **little-routine** → **Settings** → **Variables and Secrets**

说明：

- **Secrets** 跨部署保留。
- **明文变量**以 `cloudflare.config.ts` 为准；每次部署会同步配置里声明的 text，未声明的明文变量可能被清掉。

### 第 5 步：确认绑定已创建

`npm run deploy` / `cf deploy` 会按配置自动开通绑定（通常无需手建）：

| 绑定名 | 类型 | 用途 |
|--------|------|------|
| `DB` | D1 | 业务数据 |
| `SESSION_KV` | KV | 会话 |
| `VINEXT_KV_CACHE` | KV | 缓存 |
| `ASSETS` | Assets | 静态资源 |

在 Dashboard → Worker → **Settings** → **Bindings** 中应能看到它们。

### 第 6 步：定时任务（Cron）

配置里已写：每 **10 分钟** 触发一次（`*/10 * * * *`）。

流程：`worker/index.ts` 的 `scheduled` → 推送提醒；每月最后一天还会生成 AI 月度摘要。日常打卡统计是按日志实时算的。

手动触发（调试用）：

```bash
curl -X POST "https://<你的-worker域名>/api/cron/reminders" \
  -H "x-cron-secret: $CRON_SECRET"
```

把 `$CRON_SECRET` 换成与生产一致的值。

### 第 7 步：绑定自定义域名（可选）

**重要：** 域名可以继续在阿里云**注册/续费**，但 **DNS 权威解析必须交给 Cloudflare**。  
只在阿里云给 `sleep` 做 CNAME → `little-routine.xxx.workers.dev` **不够**，浏览器打不开（没有合法证书、Worker 也不认这个 Host）。Cloudflare Pages 支持外部 CNAME，**Workers Custom Domain 不支持**。

#### 7.1 先确认 Worker 已部署成功

在浏览器打开：

`https://little-routine.<你的子域>.workers.dev`

能打开应用后再绑自定义域。若部署因 Secrets 失败，先完成第 3 步。

#### 7.2 把 `cp3hnu.com` 接入 Cloudflare（DNS 迁过去，注册仍可留在阿里云）

1. 打开 https://dash.cloudflare.com → **Add a domain** → 输入 `cp3hnu.com`  
2. 选 **Free** 计划即可  
3. Cloudflare 会扫描已有 DNS 记录；对照阿里云解析，把还在用的记录补全（邮箱 MX、其它子域等），避免切 NS 后其它服务挂掉  
4. Cloudflare 会给出两个 **Nameserver**，类似：
   ```text
   xxx.ns.cloudflare.com
   yyy.ns.cloudflare.com
   ```
5. 登录 **阿里云** → 域名 → `cp3hnu.com` → **DNS 修改 / 域名信息** → 把 DNS 服务器改成 Cloudflare 给的那两个（不要继续用 `dns*.hichina.com` 等阿里云 DNS）  
6. 等待状态变为 **Active**（几分钟到数小时不等；可用 https://www.whatsmydns.net 查 NS）

域名**注册商**仍是阿里云；只是「谁解析」换成了 Cloudflare。

#### 7.3 在 Worker 上添加自定义域（不要自己手写 CNAME 到 workers.dev）

1. Dashboard → **Workers & Pages** → **little-routine**  
2. **Settings** → **Domains & Routes** → **Add** → **Custom Domain**  
3. 填 `sleep.cp3hnu.com` → 确认  

Cloudflare 会自动：

- 在该 Zone 里创建指向 Worker 的 DNS 记录  
- 签发 `sleep.cp3hnu.com` 的 HTTPS 证书  

**不要**再在阿里云（或 Cloudflare DNS）手动建一条指向 `*.workers.dev` 的 CNAME；自定义域由 Cloudflare 托管即可。

#### 7.4 更新站点 URL 并重新部署

把 `.dev.vars` / 构建环境里的：

```bash
NEXT_PUBLIC_SITE_URL=https://sleep.cp3hnu.com
```

改好后重新构建部署（该变量在构建期打进前端包）：

```bash
npm run build
npm run deploy
# 若仍缺 secrets，继续用 --secrets-file
```

#### 7.5 验证

```bash
# DNS 是否已指向 Cloudflare
dig NS cp3hnu.com +short
dig sleep.cp3hnu.com +short

# HTTPS 是否正常
curl -I https://sleep.cp3hnu.com
```

浏览器打开 `https://sleep.cp3hnu.com` 应与 `workers.dev` 同一应用。

### 第 8 步：验收清单

1. 打开 Worker URL（或自定义域）  
2. 用手机号 + 密码注册并登录  
3. 添加小孩，打起床 / 睡觉卡（可试补卡）  
4. 打开统计 / 报告（有 `QWEN_API_KEY` 时走 AI；否则规则兜底）  
5. 设置里开启推送（需 **HTTPS**；手机建议「添加到主屏幕」当 PWA）

---

## 路径 B：从 GitHub 持续部署（代码已在 GitHub 时的推荐日常路径）

适合：**首次本机部署已成功**，或你愿意在控制台配好 Build / Deploy 命令后，用 Git push 自动上线。

### 方式 1：Cloudflare Workers Builds（控制台接 Git，步骤最少）

1. 打开 https://dash.cloudflare.com → **Workers & Pages**  
2. 若还没有 `little-routine`：可先走路径 A 创建一次，或按引导 **Create** 并 **Connect to Git**，选中你的 GitHub 仓库。  
3. **Worker 名称必须与配置一致**：`little-routine`。  
4. 进入该 Worker → **Settings** → **Build**（Workers Builds），按 vinext 要求改命令：

| 项 | 填写 |
|----|------|
| **Build command** | **留空**（不要填 `npm run build`；deploy 脚本内部会构建） |
| **Deploy command** | `npm run deploy` |
| **Preview command**（可选，PR 预览） | `npx vinext-cloudflare previews deploy` |

5. 安装命令保持默认（如 `npm ci` / `npm install`）即可。  
6. 在 **Variables and Secrets** 中配置生产 Secrets（与路径 A 相同那 5 个）。若 Worker 尚不存在、无法先写 Secret，仍建议先用路径 A 的 `--secrets-file` 完成第一次。  
7. 保存后，对 `main`（或你选的生产分支）**再 push 一次**，或点 **Retry deployment**。  
8. 打开部署日志，确认 `vinext-cloudflare deploy` / `cf deploy` 成功，记下线上 URL。

注意：默认的 `npx wrangler deploy` **不能**部署本项目的 `cloudflare.config.ts`，务必改成 `npm run deploy`。

### 方式 2：GitHub Actions（仓库内流水线，可控性更强）

1. 在 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** 添加：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
2. 新增 `.github/workflows/deploy.yml`（示例，可按分支名调整）：

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      CF_SEND_TELEMETRY: "false"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
      - run: npm ci
      - run: npm run deploy
```

3. Secrets 仍须事先挂在 Cloudflare Worker 上（路径 A 首次部署或 Dashboard 配置）；Actions 只负责构建与发布代码，**不会**自动从 GitHub Secrets 注入 `SESSION_SECRET` 等到 Worker（除非你再写额外步骤）。

---

## 本地开发（对照）

```bash
cp .env.example .dev.vars
# 填好密钥后
npm run vapid   # 若尚未生成 VAPID
npm run dev     # vite dev
```

本地 secret 读自 `.dev.vars`；生产只认 Worker 上的 bindings / secrets，**不会**自动把本机 `.env` 拷到线上。

---

## 常见问题

**Q: 部署报缺少 secret？**  
A: 首次用 `--secrets-file`；之后在 Dashboard 或 `cf workers secrets update` 补齐。

**Q: GitHub 接上了但构建失败 / 用了 wrangler？**  
A: 清空 Build command，Deploy 改为 `npm run deploy`。

**Q: Workers Builds 报 `EALLOWREMOTE` / `Refusing to fetch ... npmmirror`？**  
A: 本机若用过淘宝镜像，`package-lock.json` 里的 `resolved` 会指向 `registry.npmmirror.com`。Cloudflare 构建禁止拉取这类 remote 包。  
处理：项目根目录保留 `.npmrc`（`registry=https://registry.npmjs.org/`），并把 lockfile 里的 npmmirror 地址全部换成 `registry.npmjs.org` 后重新 push。本机以后在本仓库执行 `npm install` 会走官方源。

**Q: 推送提醒不工作？**  
A: 确认 VAPID 公私钥成对且与线上一致；站点必须是 HTTPS；移动端尽量安装为 PWA。

**Q: AI 报告很空或像模板？**  
A: 检查 `QWEN_API_KEY`；未配置时会用规则文案兜底。

**Q: 改了 `NEXT_PUBLIC_SITE_URL` 线上没变？**  
A: 属于构建期变量，改完后必须重新 `build` + `deploy`。

---

## 推荐操作顺序（最短路径总结）

1. 本机：`npx cf auth login`  
2. 准备 `.dev.vars` + `npm run vapid` + 随机 `SESSION_SECRET` / `CRON_SECRET`  
3. `npm run build` + `npx cf deploy --prebuilt --mode production --secrets-file ./secrets.env`  
4. 浏览器打开 Worker URL，按验收清单测一遍  
5. Cloudflare Dashboard 把 GitHub 仓库接到 **little-routine**，Deploy command = `npm run deploy`  
6. 以后：改代码 → `git push` → 自动部署  

这样「第一次」最快、稳；「以后」也最快、省事。
