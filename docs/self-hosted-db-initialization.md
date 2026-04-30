# Self-hosted Supabase DB 初始化憑證方案

本文只處理初始化資料表和 migrations 的 DB 管理憑證。前端 `.env` 只能放 browser-safe 變量，例如 `VITE_SUPABASE_URL` 和 anon/publishable key。

## 原則

- 不把 Postgres URL、Postgres password、service role key、JWT secret 放進前端 `.env`。
- 不把 DB 管理憑證提交到 Git。
- 優先在 self-hosted Supabase 服務器內執行 migration，避免把 Postgres 暴露到公網。
- 如果必須從本機連線，優先用短時 SSH tunnel 或受限來源 IP。
- 初始化 table 只需要 Postgres 管理連線，不需要 service role key。

## 推薦方式 A：服務器內執行

在部署 self-hosted Supabase 的服務器上，使用 Docker network 內部地址或本機 Postgres port 執行：

```bash
export SUPABASE_DB_URL='postgresql://postgres:<password>@127.0.0.1:5432/postgres?sslmode=disable'
scripts/supabase-push-db.sh
```

如果 self-hosted Postgres 只在 Docker network 內可見，可以在同一台機器上根據實際 compose 配置改成服務名和端口。

## 推薦方式 B：本機交互輸入

只把非敏感連線參數放在當前 shell，password 由腳本交互輸入且不回顯：

```bash
export SUPABASE_DB_HOST='db.example.com'
export SUPABASE_DB_PORT='5432'
export SUPABASE_DB_USER='postgres'
export SUPABASE_DB_NAME='postgres'
export SUPABASE_DB_SSLMODE='require'

scripts/supabase-push-db.sh
```

腳本會先列出 migration 狀態，再執行 `supabase db push --db-url ...`。

## 方式 C：一次性完整 URL

只適合 CI secret 或臨時 shell，不建議直接打在會保存 history 的終端命令裡：

```bash
export SUPABASE_DB_URL='postgresql://postgres:<password>@db.example.com:5432/postgres?sslmode=require'
scripts/supabase-push-db.sh
unset SUPABASE_DB_URL
```

## Dry run

先看會套用哪些 migration：

```bash
scripts/supabase-push-db.sh --dry-run
```

## 生成 DB types

初始化成功後重新生成前端使用的 TypeScript DB types：

```bash
scripts/supabase-push-db.sh --types
```

## 初始化後驗證

用前端 `.env` 裡的 public URL 和 anon key 測試 PostgREST：

```bash
node -e "const fs=require('fs'); const raw=fs.readFileSync('.env','utf8'); const env={}; for(const line of raw.split(/\r?\n/)){ const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/); if(!m || m[1].startsWith('#')) continue; let v=m[2]; if((v.startsWith('\"')&&v.endsWith('\"'))||(v.startsWith(\"'\")&&v.endsWith(\"'\"))) v=v.slice(1,-1); env[m[1]]=v } import('@supabase/supabase-js').then(async ({createClient})=>{ const url=env.VITE_SUPABASE_URL; const key=env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY; const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}); const {data,error,status}=await supabase.from('novels').select('id').limit(1); console.log({ok:!error,status,error:error?.message,rows:data?.length}) })"
```

預期結果是 `ok: true`。未登入狀態下通常會得到空陣列，這是 RLS 預期行為。
