# Legacy Supabase Hosted 接入規格

Last updated: 2026-04-27

> Status: historical reference. The current migration target is self-hosted Supabase. For DB initialization and credential handling, use `docs/self-hosted-db-initialization.md` and `scripts/supabase-push-db.sh`.

本文檔整理目前關於把 Novel Maker 接入 Supabase Hosted 的產品與技術決策。它是後續實作的依據，不是最終 API 文檔；如實作中發現約束衝突，應先更新本文檔再改代碼。

## 1. 現狀

目前專案是 Vite + React + TypeScript 純前端 app。

- 主要資料在 `src/App.tsx` 的 React state 中。
- 初始章節、角色、筆記在 `src/lib/data.ts`。
- 使用者偏好設定在 `src/hooks/useSettings.ts`，目前只寫入 `localStorage`。
- AI 目前在 `src/lib/ai.ts` 直接由瀏覽器呼叫 OpenAI，且使用 `dangerouslyAllowBrowser: true`。接入 Supabase 後必須移除前端 OpenAI key。

## 2. 高層目標

原方案使用 Supabase Hosted service，不 self-host。當前遷移目標已改為 self-hosted Supabase。

第一版要完成：

- Supabase Auth：Email + 密碼。
- 多使用者，每位使用者只能看到自己的資料。
- 每個使用者可建立多本小說。
- 每本小說只有建立者本人可存取，不做共享協作。
- Supabase Postgres 保存小說、章節、角色、筆記、設定、AI 用量。
- Row Level Security 保護資料隔離。
- IndexedDB 支援離線草稿與弱網同步。
- AI key 移到 Supabase Edge Functions。
- AI endpoint 和 model name 可配置，支援 OpenAI-compatible provider。
- 寫作 AI 支援 SSE streaming。
- 使用 Supabase CLI 管理 migrations、Edge Functions、DB types。

第一版不做：

- 協作共享。
- 公開作品頁。
- 帳號刪除。
- 付費、升級入口、Pro UI。
- AI 請求歷史保存。
- AI prompt/response 日誌。
- 小說複製。
- 章節/角色/筆記級歸檔。

## 3. 環境與部署策略

使用兩個 Supabase Hosted 專案：

- dev
- production

本地前端暫時只跑 Vite dev server，預設連 dev Supabase project。

本地 `.env`：

```env
VITE_SUPABASE_URL=https://<dev-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

AI secrets 不進前端，也不進 repo。dev / production 分別在 Supabase Secrets 裡配置：

```env
AI_API_BASE_URL=https://api.openai.com/v1
AI_API_KEY=...
AI_INIT_MODEL=...
AI_WRITING_MODEL=...
```

Supabase CLI 工作流：

```bash
npx supabase init
npx supabase link --project-ref <dev-ref>
npx supabase db push
npx supabase functions deploy <function_name>
```

production 先不要直接接本地開發；migrations 和 functions 在 dev 驗證後再 link 到 prod 推送。

Auth redirect URLs 第一版至少配置：

```text
http://localhost:5173/**
http://localhost:5173/update-password
```

## 4. Auth 決策

### 4.1 登入方式

- 使用 Supabase Auth。
- Email + 密碼。
- 不開 Email confirmation。
- 使用 Supabase 預設密碼規則；前端只檢查欄位非空與確認密碼一致。

### 4.2 會話策略

採用「登入後主動登出其他 session」方案：

```ts
await supabase.auth.signOut({ scope: 'others' })
```

使用限制：

- 當前設備保持登入。
- 其他設備的 refresh token 會被撤銷。
- 舊設備 access token 可能在 JWT 到期前仍短暫有效。
- 不做多設備衝突合併。
- 多 tab 不允許同時編輯；後開 tab 顯示已有活動編輯頁。

### 4.3 忘記密碼與重設密碼

登入頁提供「忘記密碼」。

流程：

1. 使用者輸入 email。
2. 呼叫 `resetPasswordForEmail(email, { redirectTo })`。
3. 使用者點 email link 回到 `/update-password`。
4. 輸入新密碼與確認密碼。
5. 呼叫 `updateUser({ password })`。
6. 成功後保持登入並進入小說庫。

### 4.4 已登入修改密碼

放在 SettingsPanel 的帳號區。

- 輸入目前密碼、新密碼、確認新密碼。
- 更新成功後呼叫 `signOut({ scope: 'others' })`。
- 當前設備保持登入。

是否強制驗證 `currentPassword` 取決於 Supabase project 設定與 supabase-js 支援；產品 UI 上仍要求目前密碼。

### 4.5 登出資料保護

使用者主動登出時：

1. 先嘗試 flush 所有 pending local changes。
2. 檢查本地與雲端是否一致。
3. 若一致，清除當前使用者 IndexedDB 草稿並登出。
4. 若不一致，彈出警告：

```text
雲端同步失敗，依舊登出會丟棄本地草稿。
```

彈窗提供：

- 主按鈕：返回並重試同步
- 危險按鈕：依舊登出並丟棄草稿

使用者選擇危險按鈕時，未同步的離線新小說也一起丟棄。

## 5. Product UI 流程

### 5.1 App 入口

```text
未登入
-> AuthGate 登入/註冊/忘記密碼

已登入但未選小說
-> NovelLibrary 小說庫

已選小說
-> 現有寫作編輯器
```

登入頁、小說庫、新建小說 wizard 都沿用現有工作室風格：

- 不做 marketing hero。
- 不做大圖或插畫入口頁。
- 使用現有 theme token、字體、低飽和色、邊框與 panel/modal 氣質。
- 不改原始設計風格。

### 5.2 小說庫

小說列表：

- 顯示未歸檔小說。
- 按 `updated_at desc`，最近編輯優先。
- 不做搜尋。
- 不做手動排序。

每個小說項顯示：

- 標題
- 最近編輯時間
- 章節數
- 總字數
- 創作語言

已歸檔列表：

- 只顯示小說本體，不載入章節/角色/notes。
- 按 `archived_at desc`。
- 顯示剩餘可恢復天數。

### 5.3 小說設定

放在 `SettingsPanel` 中，不在主編輯畫面新增高干擾入口。

設定面板區塊：

- 偏好設定
  - 主題
  - 字體大小
  - 行高
  - 預設顯示 AI
  - UI 語言
- 小說設定
  - 小說標題
  - 創作語言 `source_language`
  - 歸檔小說
- 帳號
  - 修改密碼
  - 登出
- AI 用量
  - AI 初始化：`0/1`
  - 寫作輔助：`8/20`

小說 metadata 第一版只支持：

- 標題
- 創作語言

不做類型、風格、目標篇幅、簡介、封面、標籤。

### 5.4 歸檔

第一版只做小說級歸檔。

- 不做章節/角色/筆記級歸檔。
- 歸檔不彈二次確認。
- 歸檔按鈕附近用文字說明：歸檔後 7 天內可恢復。

歸檔時：

```sql
archived_at = now()
purge_after = now() + interval '7 days'
```

恢復時：

```sql
archived_at = null
purge_after = null
```

每天一次 Supabase Cron 硬刪：

```sql
delete from novels
where archived_at is not null
  and purge_after <= now();
```

子資料使用 foreign key `on delete cascade` 刪除。

## 6. 新建小說與 AI 初始化

### 6.1 基本原則

新建小說主流程是 AI 輔助初始化，但提供小字跳過。

- 使用者先起小說名。
- AI 不參與命名。
- 使用者可自行改名。
- AI 初始化結果只做預覽，不在接受前編輯。
- 接受後才正式落庫。
- 拒絕時直接建立空白小說。

### 6.2 新建流程

```text
1. 使用者輸入小說標題
2. 使用者輸入初始想法
3. 可小字跳過 AI，直接建立空白小說
4. AI 生成 3-5 題問卷
5. 使用者填問卷：每題可自定義或選 AI 推薦
6. 對選 AI 推薦的題目，AI 補全推薦答案
7. 使用者確認最終問卷
8. AI 生成初始化草案
9. 使用者接受或拒絕
10. 進入編輯器
```

AI 問卷要求：

- 3-5 個問題。
- 每個問題從不同角度切入。
- 每個角度只有一個提問。
- 使用者可選自定義答案或 AI 推薦。
- 問卷可以包含寬泛小說長度，例如切片、短篇、中篇、長篇、讓 AI 判斷。
- 章節數由 AI 根據問卷決定。
- 產品傾向是低成本讓使用者感受到創作興趣，所以 AI 可推薦先寫切片或短篇。

AI 初始化草案包含：

- 背景設定
- 故事大綱
- 章節列表：每章 `title + summary`
- 初始角色設定

不生成第一章開場正文。

### 6.3 跳過或拒絕 AI

跳過 AI 或拒絕 AI 草案時，建立空白小說：

- `novels.title` 使用使用者填的標題。
- 建立第一章空白章節，標題為 `無標題`。
- 建立三條固定 notes，內容為空。
- 不建立角色。

### 6.4 AI 初始化失敗

AI 步驟失敗時提供二選一：

- 重試
- 跳過，建立空白小說

重試保留目前輸入與答案，不清空使用者資料。

### 6.5 AI 初始化暫存

AI 初始化流程資料一次性暫存：

- 不建永久 `brainstorm_sessions` / `brainstorm_turns`。
- 可使用 `sessionStorage` 防刷新丟失。
- 接受或拒絕後清除暫存。

## 7. Notes 設計

Notes 使用獨立 `notes` 表，方便分片載入。

第一版 UI 仍放在左側 `Sidebar` 的 Notes tab，不新增獨立大綱面板。

固定三條 notes：

- `background`：背景設定
- `outline`：故事大綱
- `world`：世界觀筆記

標題語言：

- 優先用小說 `source_language`。
- 未知時 fallback 到 UI 語言。

第一版不允許新增自定義筆記。

## 8. 章節設計

第一版只有扁平章節列表：

- 不做卷 / 部 / 分冊。
- 支援新增章節。
- 支援拖曳重排。
- 每章有 `sort_order`。
- 載入時 `order by sort_order asc, created_at asc`。

拖曳重排：

- 使用 dnd-kit sortable。
- 不使用 react-beautiful-dnd。
- 只讓拖曳把手可拖，避免和點擊切換章節衝突。
- 拖曳完成後立即更新本地 state 和 IndexedDB。
- 線上同步 `sort_order`。
- 離線進 sync queue。
- 可每次拖曳後重新編號全部章節，例如 `10, 20, 30...`。

章節狀態：

- 資料庫保存語言無關 enum 風格值：`draft | writing | done`。
- UI 依目前介面語言翻譯顯示。
- 這能避免切換 UI 語言後完成統計錯誤。

## 9. 創作語言

分開兩個概念：

- `user_settings.lang`：UI 語言。
- `novels.source_language`：小說主要創作語言。

建立小說時：

- AI/系統可根據標題、初始想法、問卷答案自動識別。
- 空白建立時可先用 UI 語言作為預設。

建立後：

- 使用者可在小說設定中手動修改 `source_language`。
- 所有 AI Edge Function 從 DB 查 `source_language`，不完全信任前端傳值。
- AI 補完、初始化、寫作輔助都使用 `source_language` 輸出。

## 10. 自動保存與離線同步

### 10.1 保存模型

採用「本地優先，雲端同步」：

- 編輯時先更新 React state。
- 同時寫 IndexedDB。
- 線上時 debounce 同步到 Supabase。
- 離線或同步失敗時標記 dirty / pending sync。
- 恢復連線後自動同步。

正文輸入：

- 停止輸入約 800-1500ms 後同步。
- 不每個字都寫 Supabase。

角色卡：

- modal 按保存時立即寫本地並入同步流程。

筆記：

- 和正文一樣 debounce。

章節狀態、設定、排序：

- 低頻操作，可立即入同步流程。

### 10.2 IndexedDB

使用 `idb` 作為 IndexedDB promise wrapper。

本地 DB：

```text
novel-maker-db
- novels
- chapters
- characters
- notes
- user_settings
- sync_queue
```

本地資料同步欄位：

```ts
lastLocalEditAt
lastSyncedAt
remoteUpdatedAt
dirty
```

`sync_queue` 欄位：

```ts
id
userId
entityType: 'novel' | 'chapter' | 'character' | 'note' | 'user_settings'
entityId
operation: 'upsert' | 'archive' | 'restore'
novelId?
createdAt
updatedAt
attempts
lastError?
```

本地 IndexedDB 不加密。

### 10.3 離線能力

離線時允許：

- 建立空白小說。
- 建立/編輯章節。
- 編輯正文。
- 編輯固定 notes。
- 建立/編輯角色。
- 拖曳章節重排。
- 歸檔/恢復本地已知小說。

離線時不可用：

- AI 初始化。
- 寫作 AI。
- 登入/註冊/重設密碼等 Auth 操作。

離線建立新資料：

- 前端使用 `crypto.randomUUID()` 生成 id。
- DB 也用 `gen_random_uuid()` 作預設。
- upsert 接受前端生成 UUID。

### 10.4 同步衝突

第一版不做逐項 merge，不做正文 diff。

同步規則：

- 本地 dirty，雲端未變：自動推本地。
- 本地 clean，雲端較新：自動拉雲端。
- 本地 dirty，雲端也在 `last_synced_at` 後變更：視為衝突。

衝突處理：

- 一次性全局選擇，不逐章節/角色/筆記分別選。
- 彈窗顯示：
  - 本地最後編輯時間
  - 雲端最後編輯時間
  - 衝突項目數量
- 預設選項是本地覆蓋雲端。

選本地：

- 所有本地 dirty 資料批量 upsert 到 Supabase。
- 本地標記為已同步。

選雲端：

- 重新拉取該小說所有資料。
- 覆蓋 React state 和 IndexedDB。
- 清空 dirty queue。

### 10.5 保存狀態 UI

只顯示簡單圖標 + 文字，減少打擾：

- 已同步
- 保存中
- 離線草稿
- 同步失敗
- 需要選擇版本

放在目前編輯器工具列右側「已保存/保存中」的位置。

不做常駐同步佇列詳情。

Hover 可顯示簡短 tooltip：

- 最後本地編輯時間
- 最後成功同步時間

## 11. 資料模型草案

### 11.1 profiles

第一版只有 Free，但保留未來 Pro 擴展點。

```sql
profiles
- user_id uuid primary key references auth.users(id) on delete cascade
- plan text not null default 'free'
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
```

第一版只使用：

```text
free
```

不做 Pro UI、不做付款、不做升級入口。

### 11.2 user_settings

```sql
user_settings
- user_id uuid primary key references auth.users(id) on delete cascade
- variant text not null default 'parchment'
- font_size int not null default 17
- line_height numeric not null default 2
- show_ai boolean not null default true
- lang text not null default 'en'
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
```

策略：

- 登入前/啟動初期先讀 `localStorage`，避免主題閃爍。
- 登入後讀 Supabase `user_settings` 覆蓋本地。
- 修改時寫 localStorage 並同步 Supabase。
- 離線修改進 sync queue。

### 11.3 novels

```sql
novels
- id uuid primary key default gen_random_uuid()
- owner_id uuid not null references auth.users(id) on delete cascade
- title text not null
- source_language text not null default 'auto'
- archived_at timestamptz null
- purge_after timestamptz null
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
```

查詢：

- 主列表：`archived_at is null order by updated_at desc`
- 歸檔列表：`archived_at is not null order by archived_at desc`

### 11.4 chapters

```sql
chapters
- id uuid primary key default gen_random_uuid()
- novel_id uuid not null references novels(id) on delete cascade
- title text not null
- summary text not null default ''
- content text not null default ''
- word_count int not null default 0
- status text not null default 'draft'
- sort_order int not null default 0
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
```

`status` allowed values:

```text
draft
writing
done
```

### 11.5 characters

```sql
characters
- id uuid primary key default gen_random_uuid()
- novel_id uuid not null references novels(id) on delete cascade
- name text not null default ''
- age text not null default ''
- role text not null default ''
- appearance text not null default ''
- personality text not null default ''
- speech_style text not null default ''
- background text not null default ''
- relationships text not null default ''
- color text not null default '#C17F3E'
- sort_order int not null default 0
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
```

### 11.6 notes

```sql
notes
- id uuid primary key default gen_random_uuid()
- novel_id uuid not null references novels(id) on delete cascade
- title text not null
- content text not null default ''
- kind text not null
- sort_order int not null default 0
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
```

`kind` 第一版固定：

```text
background
outline
world
```

### 11.7 ai_usage_daily

```sql
ai_usage_daily
- user_id uuid not null references auth.users(id) on delete cascade
- usage_date date not null
- novel_init_count int not null default 0
- writing_ai_count int not null default 0
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- primary key (user_id, usage_date)
```

用量按 `user_id + usage_date`，跨所有小說共用。

## 12. RLS 策略

所有業務資料表啟用 RLS。

### 12.1 novels

使用者只能操作自己的小說：

```sql
owner_id = auth.uid()
```

### 12.2 子資料表

`chapters` / `characters` / `notes` 透過 `novel_id` 檢查所屬小說 owner：

```sql
exists (
  select 1
  from novels
  where novels.id = chapters.novel_id
    and novels.owner_id = auth.uid()
)
```

`characters` / `notes` 同理。

### 12.3 profiles / user_settings / ai_usage_daily

只能操作自己的 row：

```sql
user_id = auth.uid()
```

### 12.4 Edge Function 與 service role

- 前端使用 publishable key。
- service role key 只允許在 Edge Function / server-side 使用。
- Edge Function 內仍要驗證 JWT 與 ownership，不因使用 service role 就信任前端傳入的 `novelId`。

## 13. Triggers / RPC / Cron

### 13.1 updated_at trigger

所有主要表需要 `updated_at` trigger。

### 13.2 touch novel updated_at

當章節、角色、notes 變更時，自動更新所屬 `novels.updated_at`。

原因：

- 小說列表按最近編輯排序。
- 不依賴前端每次都記得 touch novel。

### 13.3 AI quota RPC

需要 RPC 來檢查與扣除 AI quota，避免前端繞過。

建議：

```sql
get_ai_usage_for_today()
consume_novel_init_quota()
consume_writing_ai_quota()
```

quota 規則由 `profiles.plan` 決定。第一版只有 `free`。

### 13.4 purge archived novels

每天一次 cron：

```sql
delete from novels
where archived_at is not null
  and purge_after <= now();
```

## 14. AI 用量限制

第一版 Free 限制：

- AI 初始化小說：每天 1 次。
- 寫作 AI：每天 20 次。
- 兩者跨所有小說共用。
- 計數使用 Supabase server/database date，不信任瀏覽器時間。

### 14.1 AI 初始化扣額

扣額節點：

- 成功生成完整初始化草案後扣 `novel_init_count + 1`。

不扣額：

- 生成問卷。
- 補全 AI 推薦答案。
- 初始化草案生成失敗。
- 跳過 AI 建立空白小說。

若使用者成功看到初始化草案，即使最後拒絕並建立空白小說，也已扣除一次。

### 14.2 寫作 AI 扣額

寫作 AI 使用 SSE streaming。

扣額規則：

- Edge Function 先檢查今日是否還有 quota。
- 發起 provider streaming request。
- 一旦收到第一個有效 text delta，就扣 `writing_ai_count + 1`。
- 使用者取消、網路斷開、瀏覽器關閉，若已返回有效 delta，仍算一次。
- provider 還沒返回任何內容就失敗，不扣。
- 重新生成算新的成功請求。

## 15. AI Provider 與 Edge Functions

### 15.1 Provider 兼容性

第一版支援 OpenAI-compatible provider。

只支援：

```http
POST {AI_API_BASE_URL}/chat/completions
Authorization: Bearer {AI_API_KEY}
Content-Type: application/json
```

不支援：

- 自定義 header name。
- 多 API key 輪換。
- provider-specific auth。
- Responses API。
- tool calling。

非 streaming request 使用通用欄位：

```json
{
  "model": "...",
  "messages": [],
  "temperature": 0.7,
  "max_tokens": 1200
}
```

### 15.2 Model 配置

分別配置：

- `AI_INIT_MODEL`
- `AI_WRITING_MODEL`

前端不傳 model name。

### 15.3 Edge Function 分工

建議 functions：

```text
generate-questionnaire
generate-recommended-answers
generate-novel-blueprint
writing-ai
```

AI 初始化 functions 不 streaming，回傳 JSON，後端 parse + validate。

`writing-ai` 使用 SSE streaming。

### 15.4 寫作 AI 請求

前端只傳少量輸入：

```ts
{
  novelId,
  mode: 'dialogue' | 'character' | 'consistency',
  activeChapterId,
  selectedText,
  contextInput,
  speakerA,
  speakerB
}
```

Edge Function 負責：

- 驗證 JWT。
- 確認 novel 屬於當前使用者且未歸檔。
- 查 `novels.source_language`。
- 查角色。
- 查 active chapter。
- 查固定三條 notes。
- 組 prompt。
- 使用 `AI_WRITING_MODEL`。
- SSE stream 回前端。

### 15.5 寫作 AI 上下文

需要帶入 notes 上下文：

- background
- outline
- world

為控制 prompt 長度：

- 每條 note 截斷，例如 1200-2000 字符。
- 角色資料只帶非空欄位。
- consistency 模式可帶較長 active chapter 片段。
- dialogue / character 模式優先帶 selectedText。
- 截斷在 Edge Function 做，不由前端控制。

### 15.6 SSE 格式

```text
event: delta
data: {"text":"..."}

event: error
data: {"message":"今日寫作 AI 次數已用完"}

event: done
data: {"usage":{"writing_ai_used":7,"writing_ai_limit":20}}
```

前端不建議使用 `supabase.functions.invoke()` 包 streaming。應直接 `fetch` Edge Function URL，使用 `ReadableStream` 解析 SSE。

### 15.7 AI 結果保存

不保存 AI 結果歷史。

- AI response 只存在當前 `AIPanel` React state。
- 關閉面板、刷新、切換小說後丟失。
- 使用者需插入編輯器或複製才保留。
- 不保存 prompt、response、mode history、error log、token usage、cost log。

## 16. TypeScript types

需要生成 Supabase database TypeScript types 並納入前端型別。

建議輸出：

```text
src/lib/database.types.ts
```

使用 Supabase CLI：

```bash
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

前端 domain types 可逐步從 `src/types.ts` 遷移或映射：

- DB row type：來自 generated database types。
- UI/domain type：保留現有 `Chapter`, `Character`, `AppSettings`，必要時增加 mapper。

## 17. 前端模組建議

新增：

```text
src/lib/supabase.ts
src/lib/database.types.ts
src/lib/novels.ts
src/lib/offlineDb.ts
src/lib/sync.ts
src/lib/aiClient.ts
src/hooks/useAuth.ts
src/hooks/useNovelLibrary.ts
src/hooks/useActiveNovel.ts
src/hooks/useSyncStatus.ts
src/components/AuthGate.tsx
src/components/NovelLibrary.tsx
src/components/NewNovelWizard.tsx
src/components/SyncConflictModal.tsx
src/components/PasswordReset.tsx
```

現有改造：

- `App.tsx`：從本地 mock state 改為 active novel state。
- `Sidebar.tsx`：小說標題由 active novel 傳入；notes 從單 textarea 改成固定三條 note。
- `SettingsPanel.tsx`：加入小說設定、帳號、AI 用量。
- `AIPanel.tsx`：不再直接呼叫 OpenAI；改為呼叫 `writing-ai` SSE。
- `src/lib/ai.ts`：移除瀏覽器 OpenAI client 或重寫為 Edge Function client。
- `src/types.ts`：章節 status 改成 enum 風格值。

## 18. 實作順序

按以下順序實作：

### Phase 1: Supabase / Auth / 基礎資料

- 安裝 `@supabase/supabase-js`。
- 建立 `src/lib/supabase.ts`。
- 建立 migrations。
- 建立 RLS policies。
- 建立 AuthGate。
- 建立 NovelLibrary。
- 支援註冊、登入、登出、忘記密碼、重設密碼、修改密碼。
- 支援多小說 CRUD：建立空白、切換、歸檔、恢復。
- 生成 database TypeScript types。

### Phase 2: 編輯器資料接入與同步

- 把 `App.tsx` 從 mock data 接到 active novel。
- chapters / characters / notes 讀寫 Supabase。
- 章節狀態改 enum。
- Notes tab 改固定三條 notes。
- 章節拖曳重排。
- IndexedDB + sync queue。
- 自動保存狀態 UI。
- 離線建立/編輯。
- 衝突彈窗。
- 登出前同步檢查。
- 多 tab 鎖。

### Phase 3: AI 初始化

- Edge Functions:
  - `generate-questionnaire`
  - `generate-recommended-answers`
  - `generate-novel-blueprint`
- AI provider config / secrets。
- Free quota: novel init 1/day。
- NewNovelWizard。
- 接受草案落庫。
- 拒絕草案建立空白小說。

### Phase 4: Streaming 寫作 AI

- Edge Function `writing-ai`。
- SSE streaming。
- Free quota: writing AI 20/day。
- AIPanel 改 streaming。
- SettingsPanel 顯示 AI 用量。

### Phase 5: 打磨與驗證

- `npm run build`。
- Supabase dev project migration dry run / push。
- Auth flows 手測。
- RLS 手測。
- 離線/恢復同步手測。
- AI quota 手測。
- 歸檔 7 天清理 function / cron 驗證。

## 19. 官方參考

- Supabase Auth password flow: https://supabase.com/docs/guides/auth/passwords
- Supabase Auth sign out scopes: https://supabase.com/docs/guides/auth/signout
- Supabase Auth redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase API keys: https://supabase.com/docs/guides/api/api-keys
- Supabase RLS / secure data: https://supabase.com/docs/guides/database/secure-data
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase CLI local development and migrations: https://supabase.com/docs/guides/cli/local-development
- Supabase Edge Function dependencies: https://supabase.com/docs/guides/functions/dependencies
- Supabase Cron: https://supabase.com/docs/guides/cron
- AI SDK OpenAI-compatible providers: https://ai-sdk.dev/providers/openai-compatible-providers
- AI SDK `streamText`: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- dnd-kit sortable: https://docs.dndkit.com/presets/sortable
- idb: https://github.com/jakearchibald/idb
