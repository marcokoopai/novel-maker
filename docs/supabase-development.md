# Supabase 開發流程

本專案使用 Supabase Hosted，先連 dev 遠端專案，本地不跑 Supabase stack。

## 本地環境

複製 `.env.example`：

```bash
cp .env.example .env
```

填入 dev project：

```env
VITE_SUPABASE_URL=https://<dev-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<dev-publishable-key>
```

Auth redirect URLs 先配置：

```text
http://localhost:5173/**
http://localhost:5173/update-password
```

## CLI

首次連 dev：

```bash
npx supabase link --project-ref <dev-project-ref>
```

推 migration 到 dev：

```bash
npx supabase db push
```

如果遇到直連 Postgres 的 TLS/網路錯誤，例如：

```text
failed to connect to postgres: failed to connect to `host=db.<project-ref>.supabase.co ...`: tls error (EOF)
```

改用 Supabase Session Pooler URL。CLI link 後通常會保存到：

```bash
cat supabase/.temp/pooler-url
```

目前 dev project 的 pooler host 類似：

```text
postgresql://postgres.<project-ref>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

把 database password 加進 URL，並加上 SSL 參數：

```bash
npx supabase migration list --db-url "postgresql://postgres.<project-ref>:<DATABASE_PASSWORD>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
npx supabase db push --db-url "postgresql://postgres.<project-ref>:<DATABASE_PASSWORD>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

如果 password 有 `@`, `#`, `/`, `?`, `:` 等特殊字元，必須先 percent-encode。這裡使用的是 Supabase project 的 database password，不是 Supabase 帳號密碼。

本 repo 也提供了互動式 helper，會在本機終端隱藏輸入 database password：

```bash
scripts/supabase-push-pooler.sh
```

也可以用環境變數非互動執行：

```bash
SUPABASE_DB_PASSWORD='<DATABASE_PASSWORD>' scripts/supabase-push-pooler.sh
```

生成 TypeScript DB types：

```bash
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

production 應在 dev 驗證後再 link 並推送：

```bash
npx supabase link --project-ref <prod-project-ref>
npx supabase db push
```

## AI Secrets

AI secrets 放 Supabase Edge Function secrets，不放前端 `.env`：

```bash
npx supabase secrets set AI_API_BASE_URL=https://api.openai.com/v1
npx supabase secrets set AI_API_KEY=<key>
npx supabase secrets set AI_INIT_MODEL=<model>
npx supabase secrets set AI_WRITING_MODEL=<model>
```

dev 和 production 各自配置 secrets。

## Gmail SMTP

開發期可以用個人 Gmail 作為 Supabase Auth custom SMTP，但只建議小流量測試。

Supabase Auth -> Emails / SMTP settings 建議：

```text
Host: smtp.gmail.com
Port: 587
Username: <your-gmail-address>
Password: <Google app password>
Sender email: <your-gmail-address>
Sender name: Novel Maker
```

如果 587 不通，改試：

```text
Host: smtp.gmail.com
Port: 465
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
