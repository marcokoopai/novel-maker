# Supabase 開發流程

本專案目前以 self-hosted Supabase 為主要開發目標。前端本地只跑 Vite dev server，資料庫 schema 透過 Supabase CLI 的 `--db-url` 推到 self-hosted Postgres。

## 本地環境

複製 `.env.example`：

```bash
cp .env.example .env
```

填入 self-hosted Supabase public API：

```env
VITE_SUPABASE_URL=https://supabase.example.com
VITE_SUPABASE_ANON_KEY=<anon-key>
```

`.env` 是前端 build-time 設定，只能放 public URL 和 anon/publishable key。不要把 Postgres URL、Postgres password、service role key 或 JWT secret 放進前端 `.env`。

Auth redirect URLs 先配置：

```text
http://localhost:5173/**
http://localhost:5173/update-password
```

## DB 初始化與 migrations

self-hosted 不使用 `supabase link --project-ref`。DB migrations 直接用 Postgres connection string：

```bash
scripts/supabase-push-db.sh
```

推薦只在當前 shell 提供非敏感連線參數，password 由腳本交互輸入且不回顯：

```bash
export SUPABASE_DB_HOST='db.example.com'
export SUPABASE_DB_PORT='5432'
export SUPABASE_DB_USER='postgres'
export SUPABASE_DB_NAME='postgres'
export SUPABASE_DB_SSLMODE='require'

scripts/supabase-push-db.sh
```

也可以用一次性 secret 變量：

```bash
export SUPABASE_DB_URL='postgresql://postgres:<DATABASE_PASSWORD>@db.example.com:5432/postgres?sslmode=require'
scripts/supabase-push-db.sh
unset SUPABASE_DB_URL
```

詳見 `docs/self-hosted-db-initialization.md`。

生成 TypeScript DB types：

```bash
scripts/supabase-push-db.sh --types
```

## AI Secrets

AI secrets 不放前端 `.env`。self-hosted Edge Functions 使用 Docker env 或 env file 注入，例如 `AI_API_BASE_URL`、`AI_API_KEY`、`AI_INIT_MODEL`、`AI_WRITING_MODEL`，修改後需要重建或重啟 functions service。

## Gmail SMTP

開發期可以用個人 Gmail 作為 Supabase Auth custom SMTP，但只建議小流量測試。self-hosted 透過 Supabase Docker `.env` 配置 SMTP：

```text
SMTP_ADMIN_EMAIL=<your-gmail-address>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-gmail-address>
SMTP_PASS=<Google app password>
SMTP_SENDER_NAME=Novel Maker
```

如果 587 不通，改試：

```text
SMTP_PORT=465
```

注意事項：

- Gmail 必須開啟 2-Step Verification。
- Password 必須使用 Google App Password，不是 Gmail 登入密碼。
- App Password 建議去掉顯示中的空格後貼入。
- Sender email 與 SMTP username 先保持完全一致。
- 個人 Gmail 不適合作 production；正式環境優先使用 Resend、SendGrid、Postmark、AWS SES 等交易郵件服務。
- 若信件發送失敗，先看 Supabase Dashboard -> Logs -> Auth logs。常見錯誤包含 Gmail 拒絕密碼、From address 不匹配、SMTP port/TLS 不匹配。
- 配置 custom SMTP 後 Supabase 仍有 Auth rate limits，必要時到 Authentication -> Rate Limits 調整。

## Cron

歸檔小說 7 天後硬刪。每天一次執行：

```sql
select public.purge_expired_archived_novels();
```

可在 Supabase Dashboard 的 Cron 頁面建立排程。
