# web 遷移至 SvelteKit 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `sveltekit` 分支把 `web/` 的 Next.js 16 app 原地換成功能、視覺、SEO 等同的 SvelteKit app，於 Vercel preview 驗證後 merge 切換。

**Architecture:** 單 repo、單 Vercel 專案；`vercel.json` 指定 `framework: sveltekit` 並以 edge rewrite 把 `/api/v1/*` 轉 Cloud Run。純 TS 業務層原樣搬入 `src/lib`，UI 以 shadcn-svelte 重建，頁面依路由群組逐一移植，每頁以截圖與 `<head>` 比對對正式站驗收。

**Tech Stack:** SvelteKit 2、Svelte 5 runes、`@sveltejs/adapter-vercel`、Tailwind 4、shadcn-svelte（Bits UI）、`mode-watcher`、`@lucide/svelte`、`marked`、`@vercel/og`、`qrcode`、`date-fns`、playwright-core（驗證用）。

**Spec:** `docs/superpowers/specs/2026-10-19-sveltekit-migration-design.md`

## Global Constraints

- UI、註解、commit message 一律繁體中文；commit 結尾加 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- 所有工作在 `sveltekit` 分支；**不得 push main、不得改 main**，切換（Task 15）需使用者明確同意。
- 舊版原始碼參考：`git worktree add ../web-next-ref main`（唯讀，只看不改）。
- Vercel region `sin1`。
- 環境變數名不變：`kit.env.publicPrefix = 'NEXT_PUBLIC_'`；server 端沿用 `BACKEND_URL`、`VISITOR_HASH_SALT`、Resend 相關變數。
- 深色模式 localStorage key 為 `theme`、值 `light|dark|system`、以 `<html class="dark">` 套用（與 next-themes 相容）。
- 字體：英數 Inter（CSS 變數 `--font-inter`）、繁中 Noto Sans TC 400/500/600/700（`--font-noto-sans-tc`）。
- 快取秒數：area / specialty / sitemap / 落地頁 3600；診所 300；service-categories 3600；診所 OG 圖 86400。
- 需登入頁（`member/**`、`booking/**`、`admin/**`、`auth/complete-profile`）一律 `export const ssr = false`。
- 新程式碼完成時跑 Snyk code scan 至乾淨（web/CLAUDE.md 規定）。
- 不改後端、不改 API 契約、不做 UI 改版、不導入 OpenAPI 產生。
- 本地後端在 port 8001（8000 被其他專案佔用）。

## Review Focus

1. **API 路徑尾斜線**：Next 設了 `skipTrailingSlashRedirect`；SvelteKit 預設會把 `/x/` 308 到 `/x`。`/api/v1/...` 帶或不帶尾斜線都必須原樣抵達 FastAPI，頁面路由則維持 Next 現行行為。→ Task 2 測試。
2. **既有使用者主題偏好**：localStorage `theme=dark` 的使用者首屏就要是深色、不閃白。→ Task 4 測試。
3. **登入中的使用者**：切換當下已登入者（localStorage 有 `access_token`/`refresh_token`）不需重登；多個並行 401 只觸發一次 refresh。→ Task 3 測試。
4. **不存在的診所 / 縣市 / 科別**：必須回 HTTP 404（不是 200 空頁），否則污染索引。→ Task 8、9 測試。
5. **診所資料含惡意字串**：名稱 / 地址含 `</script>` 不得在 JSON-LD 中逃逸。→ Task 3 測試。

---

## 路由移植食譜（Task 7–14 共用）

每個路由群組 task 依此執行，task 內只列差異：

1. 從 `../web-next-ref/src/app/<route>` 與其用到的 `src/components/<group>` 讀舊版。
2. 元件改寫為 Svelte 5（`$props` / `$state` / `$derived`），放 `src/lib/components/<group>/`，檔名改 PascalCase `.svelte`。
3. 對照：`next/link` → `<a>`；`useRouter().push` → `goto`；`useSearchParams` / `usePathname` → `page` from `$app/state`；`next/image` → `<img loading="lazy" width height>`；`useAuth()` → `getAuth()`（Task 4）；`lucide-react` → `@lucide/svelte`。
4. 公開頁：資料在 `+page.server.ts` `load` 以 `{ fetch }` 呼叫 `$lib/api`，回傳 `seo: SeoProps`，頁面放 `<Seo {...data.seo} />`；有快取秒數者呼叫 `setHeaders`。需登入頁：`+page.ts` 設 `ssr = false`，資料在元件內抓。
5. 把該群組路由加入 `scripts/parity/routes.json`（Task 5）。
6. 驗證：`pnpm check` 0 錯誤；`pnpm build` 成功；push 分支等 preview 部署完；`node scripts/parity/seo-diff.mjs --preview <url> --group <group>` 0 差異；`node scripts/parity/screenshot.mjs --preview <url> --group <group>` 產出差異圖，人工確認無非預期差異；task 列出的功能煙霧手動走一次。
7. commit：`feat(svelte): 移植 <群組>`。

---

## 第 1 期：骨架

### Task 1: 前置與分支

**Files:** 無程式變更

- [ ] **Step 1:** 向使用者確認 main 上 10 個未 commit 檔案的處理方式（由使用者 commit 或指示），`git status` 乾淨才繼續。
- [ ] **Step 2:** `git switch -c sveltekit`；`git worktree add ../web-next-ref main`。
Expected：`git branch --show-current` 輸出 `sveltekit`；`../web-next-ref/src/app` 存在。

### Task 2: SvelteKit 專案骨架與後端連線

**Files:**
- Delete: `src/`（整個 Next 原始碼，舊版看 `../web-next-ref`）、`next.config.ts`、`next-env.d.ts`、`eslint.config.mjs`、`postcss.config.mjs`、`components.json`、`tsconfig.tsbuildinfo`
- Modify: `package.json`、`vercel.json`、`tsconfig.json`
- Create: `svelte.config.js`、`vite.config.ts`、`src/app.html`、`src/app.css`、`src/routes/+layout.svelte`、`src/routes/+page.svelte`（暫時佔位）、`eslint.config.js`、`tests/rewrite.test.mjs`

**Interfaces:**
- Produces: `pnpm dev`（5173，`/api/v1` proxy 到 `http://localhost:8001`）、`pnpm build`、`pnpm check`（svelte-check）、`pnpm lint`、`pnpm test`（`node --test tests/`）。

- [ ] **Step 1:** `package.json` 移除 next、react、react-dom、@types/react*、eslint-config-next、next-themes、@radix-ui/*、radix-ui、@react-oauth/google、react-apple-signin-auth、react-day-picker、react-markdown、remark-gfm、lucide-react、@tailwindcss/postcss、shadcn；加入 @sveltejs/kit、svelte、@sveltejs/adapter-vercel、@sveltejs/vite-plugin-svelte、vite、@tailwindcss/vite、svelte-check、eslint-plugin-svelte、typescript-eslint、mode-watcher、@lucide/svelte、bits-ui、marked、@vercel/og（皆取最新穩定版）。scripts 如上。保留 sync:developers。
- [ ] **Step 2:** `svelte.config.js`：adapter-vercel `{ regions: ['sin1'] }`；`kit.env.publicPrefix: 'NEXT_PUBLIC_'`；`kit.alias` 不加 `@`（一律 `$lib`）。
- [ ] **Step 3:** `vercel.json`：`{ "framework": "sveltekit", "regions": ["sin1"], "rewrites": [{ "source": "/api/v1/:path*", "destination": "<BACKEND_URL 正式值>/api/v1/:path*" }] }`。BACKEND_URL 正式值向使用者取得或從 Vercel env 讀（`vercel env ls`，不解密則請使用者提供網址）。
- [ ] **Step 4:** `src/app.css` = 舊 `src/app/globals.css` 原樣（`@import "tailwindcss"` 等保留）；`src/app.html` 以 Google Fonts `<link>` 載入 Inter 與 Noto Sans TC 400–700，`<html lang="zh-Hant">`，在 `<head>` 定義 `--font-inter`、`--font-noto-sans-tc`。
- [ ] **Step 5: 寫失敗測試** `tests/rewrite.test.mjs`：讀 `PREVIEW_URL` env，未設則 `test.skip`；

```js
test("/api/v1 帶尾斜線不被 308 改寫並抵達後端", async () => {
  for (const p of ["/api/v1/service-categories", "/api/v1/service-categories/"]) {
    const r = await fetch(PREVIEW_URL + p, { redirect: "manual" });
    assert.notEqual(r.status, 308, p);
    assert.match(r.headers.get("content-type") ?? "", /json/, p);
  }
});
```
- [ ] **Step 6:** `pnpm install && pnpm build` 成功；commit；push `sveltekit`；取得 preview URL。
- [ ] **Step 7:** `PREVIEW_URL=<url> pnpm test` → PASS。若 rewrite 被 SvelteKit catch-all 搶走或尾斜線被改寫：改建 `src/routes/api/v1/[...path]/+server.ts` 代理（移植舊 `route.ts`，含 body buffer 與 header 過濾），並在 `svelte.config.js` 確認該路由不做尾斜線正規化；重跑至 PASS。
- [ ] **Step 8:** commit `feat(svelte): 建立 SvelteKit 骨架與後端 rewrite`。

### Task 3: 搬入純 TS 業務層

**Files:**
- Create（自 `../web-next-ref/src` 複製）：`src/lib/api/**`、`src/lib/types/**`（原 `src/types`）、`src/lib/constants/**`、`src/lib/validation/**`、`src/lib/auth/auth-events.ts`、`src/lib/auth/roles.ts`、`src/lib/seo/**`、`src/lib/clinic-discovery.ts`、`src/lib/booking-draft.ts`、`src/lib/service-price.ts`、`src/lib/color-contrast.ts`、`src/lib/feature-access.ts`、`src/lib/utils.ts`、`src/lib/email-templates.ts`、`src/lib/developers.ts`
- Create: `tests/discovery-booking.test.mjs`、`tests/security.test.mjs`（自舊版搬來改路徑）、`tests/api-client.test.mjs`

**Interfaces:**
- Produces: `api.get/post/put/patch/delete<T>(endpoint, …, options?: RequestOptions)`，`RequestOptions` 新增 `fetch?: typeof globalThis.fetch`；所有供 server `load` 使用的查詢函式（clinics、service-categories、seo/landing-data 等）新增最後一個可選參數 `opts?: { fetch?: typeof globalThis.fetch }` 並往下傳。`API_BASE_URL` server 端讀 `$env/dynamic/private` 的 `BACKEND_URL`，瀏覽器端為 `""`。`serializeJsonLd(data: unknown): string` 不變。

- [ ] **Step 1:** 複製檔案，`@/types/` → `$lib/types/`、`@/lib/` → `$lib/`；移除所有 `next: { revalidate }`。
- [ ] **Step 2: 寫失敗測試** `tests/api-client.test.mjs`：

```js
test("傳入的 fetch 會被使用，且不出現在送出的 RequestInit", async () => {
  const calls = [];
  const fake = async (url, init) => { calls.push([url, init]); return new Response("{}", { status: 200, headers: { "content-type": "application/json" } }); };
  await api.get("/api/v1/ping", { fetch: fake });
  assert.equal(calls.length, 1);
  assert.equal("fetch" in calls[0][1], false);
});
test("並行三個 401 只呼叫一次 /auth/refresh", async () => { /* 以 fake fetch + 假 localStorage 模擬，斷言 refresh 呼叫次數 === 1、三個請求皆重試成功 */ });
```
- [ ] **Step 3:** `pnpm test` → api-client FAIL。
- [ ] **Step 4:** `client.ts` 的 `request` 解構出 `fetch: fetchImpl = globalThis.fetch` 並用它；查詢函式加 `opts` 參數。
- [ ] **Step 5:** `tests/security.test.mjs` 移除 react 依賴：改以字串 `` `<script type="application/ld+json">${json}</script>` `` 組 HTML 做原斷言（Svelte `{@html}` 為原樣輸出，等價）。`pnpm test` 全 PASS；`pnpm check` 0 錯誤。
- [ ] **Step 6:** commit `feat(svelte): 搬入 API 與業務邏輯層`。

### Task 4: UI 基礎元件、主題、Auth、全站 layout

**Files:**
- Create: `src/lib/components/ui/*`（shadcn-svelte CLI 加入 20 個：accordion、alert-dialog、avatar、badge、button、calendar、card、checkbox、dialog、input、label、popover、radio-group、select、separator、sheet、skeleton、table、tabs、textarea）、`src/lib/auth/auth.svelte.ts`、`src/lib/components/Seo.svelte`、`src/lib/components/ThemeToggle.svelte`、`src/lib/components/layout/SiteHeader.svelte`、`src/lib/components/layout/SiteFooter.svelte`、`src/routes/+layout.svelte`、`src/routes/+layout.ts`
- Test: `tests/theme.test.mjs`

**Interfaces:**
- Produces:
  - `class Auth { user: User|null; isLoading: boolean; isAuthenticated: boolean; sessionExpiredMessage: string|null; login(email, password): Promise<User>; loginWithGoogle(idToken): Promise<User>; loginWithApple(idToken, userName?): Promise<User>; register(email, password): Promise<void>; logout(redirectTo?): void; refreshUser(): Promise<void>; clearSessionExpiredMessage(): void }`（行為同舊 `auth-context.tsx`）；`setAuth(): Auth`（root layout 呼叫）、`getAuth(): Auth`。
  - `requireMember()`、`requireSystemAdmin()`：舊 `use-require-*.ts` 的 Svelte 版，於元件 `$effect` 內未授權即 `goto` 舊版同一路徑。
  - `Seo.svelte` props：`{ title?: string; description?: string; canonical: string; image?: string; jsonLd?: unknown; noindex?: boolean }`；title 依 `"%s | Cross"` 模板，未給則用舊 root metadata 預設值；其餘 root metadata（keywords、robots、openGraph、twitter、全站 JSON-LD）放 `+layout.svelte` `<svelte:head>`，值逐字取自舊 `src/app/layout.tsx`。
  - 主題：`<ModeWatcher modeStorageKey="theme" defaultMode="system" disableTransitions />`。

- [ ] **Step 1:** shadcn-svelte init（base color、CSS 變數沿用 `app.css` 既有 token，不覆蓋）並加入 20 元件；對照 `../web-next-ref/src/components/ui/*.tsx` 把我們自己改過的 class / variant 補上。
- [ ] **Step 2: 寫失敗測試** `tests/theme.test.mjs`（playwright-core + 系統 Chrome，對 `pnpm preview` 本地伺服器）：`localStorage.theme="dark"` 後 reload，於 `DOMContentLoaded` 時 `document.documentElement.classList.contains("dark") === true`。
- [ ] **Step 3:** 實作 layout / 主題 / Auth / Seo / header / footer（移植舊 `components/home/site-header.tsx`、`site-footer.tsx`、`theme-toggle.tsx`）。
- [ ] **Step 4:** `pnpm test`、`pnpm check` PASS。
- [ ] **Step 5:** commit `feat(svelte): UI 基礎元件、主題、Auth 與全站 layout`。

### Task 5: 比對工具

**Files:**
- Create: `scripts/parity/routes.json`、`scripts/parity/seo-diff.mjs`、`scripts/parity/screenshot.mjs`

**Interfaces:**
- Produces:
  - `routes.json`：`{ "<group>": [{ "path": "/terms", "auth": false }, …] }`；需參數的路由放實際範例值（真實診所 id、縣市、科別代碼取自正式站 sitemap）。
  - `node scripts/parity/seo-diff.mjs --preview <url> [--group <g>]`：對 `https://cross.twinhao.com` 與 preview 抓每條非 auth 路由，抽出 `<title>`、`meta[name=description]`、`link[rel=canonical]`、所有 `meta[property^=og:]`、`meta[name^=twitter:]`、`meta[name=robots]`、各 `application/ld+json`（JSON.parse 後深比較）與 HTTP status；有差異印出並 exit 1。canonical / og:url 比較前把 preview host 換成正式 host。
  - `node scripts/parity/screenshot.mjs --preview <url> [--group <g>]`：每路由截 light / dark / 375px 三張（新舊各一），存 `scripts/parity/out/<group>/`，並輸出像素差異比例；auth 路由需 `PARITY_TOKEN` env 注入 localStorage（做法見記憶 project-ui-screenshot-verify）。`out/` 加入 `.gitignore`。

- [ ] **Step 1:** 寫兩支腳本與 `routes.json`（先只填 `static` 群組：`/terms`、`/privacy`、`/refund`、`/pricing`）。
- [ ] **Step 2:** 以 `--preview https://cross.twinhao.com` 對自己跑，預期 0 差異（驗證腳本本身）。
- [ ] **Step 3:** commit `chore(svelte): 新增 SEO 與截圖比對工具`。

### Task 6: 靜態頁與 2 個 API route

**Files:**
- Create: `src/routes/{terms,privacy,refund,pricing}/+page.svelte`（+ 需要時 `+page.server.ts`）、`src/lib/components/pricing/*`、`src/routes/api/join/+server.ts`、`src/routes/api/track-view/+server.ts`
- Test: `tests/track-view.test.mjs`

- [ ] **Step 1: 寫失敗測試** `tests/track-view.test.mjs`：import `POST` from route，`VISITOR_HASH_SALT` 未設時回 204 且不呼叫 fetch；有 salt 時送往後端的 body 不含原始 IP 字串。
- [ ] **Step 2:** 移植 `api/track-view`、`api/join`（邏輯逐行對照舊版，只換 Request/Response API 與 `$env/dynamic/private`）。測試 PASS。
- [ ] **Step 3:** 依「路由移植食譜」移植 4 個靜態頁。
- [ ] **Step 4:** 食譜第 6 步驗證（group `static`）。
- [ ] **Step 5:** commit `feat(svelte): 移植靜態頁與 join / track-view API`。

---

## 第 2 期：民眾端（Task 7–11 彼此獨立，可平行；皆依「路由移植食譜」）

### Task 7: 首頁
- 路由 `/`；元件 `home/*`（12）、`clinics/*`（7）、`public/*`。
- `use-service-taxonomy` → `src/lib/hooks/service-taxonomy.svelte.ts`，`use-favorites` → `src/lib/hooks/favorites.svelte.ts`（rune class，多處共用同一實例）。
- 預設 OG：把正式站 `/opengraph-image` 輸出存成 `static/og.png`，root layout `og:image` 指向它。
- 煙霧：搜尋列送出跳轉 `/search?…` 參數與舊版相同。

### Task 8: 診所詳情與診所 OG 圖
- 路由 `/clinic/[clinic-id]`、`/clinic/[clinic-id]/opengraph-image` → `src/routes/clinic/[clinic-id]/og.png/+server.ts`（`@vercel/og`，版面、Noto Sans TC 子集載入、載入失敗退化行為照舊；`cache-control` 86400）。頁面 `og:image` 改指 `/clinic/<id>/og.png`（seo-diff 對此欄位允許路徑不同，但需回 200 image/png）。
- 元件 `clinic-detail/*`（16）、`seo/*`；`/api/track-view` 呼叫照舊。
- `load` 診所不存在 → `error(404)`。測試：seo-diff 的 routes.json 加 `{ "path": "/clinic/00000000-0000-0000-0000-000000000000", "expectStatus": 404 }`。
- 快取 300。

### Task 9: 在地落地頁、sitemap、robots
- 路由 `/area`、`/area/[city]`、`/specialty`、`/specialty/[code]`、`sitemap.xml/+server.ts`、`robots.txt/+server.ts`。快取 3600。
- 未知縣市 / 科別 → `error(404)`；routes.json 各加一筆 `expectStatus: 404`。
- 測試：`seo-diff.mjs` 另比對 sitemap 的 `<loc>` 集合完全相同、robots.txt 內容相同。

### Task 10: 搜尋
- 路由 `/search`；search params 解析與舊版相同（同 URL → 同結果數，seo-diff 加比對結果卡片數）。

### Task 11: 預約流程
- 路由 `/booking/[clinic-id]`、`/booking/[clinic-id]/success`，`ssr = false`；元件 `booking/*`（16）、calendar。
- 煙霧：preview 上以測試帳號完成一筆預約 → success 頁 → 後台可見（之後取消）。

### Task 12: 登入、會員、加入、短連結
- 路由 `/auth`、`/auth/complete-profile`、`/member`、`/member/appointments/[id]`、`/member/favorites`、`/member/patients`、`/join`、`/join/apply`、`/join/verify`、`/c/[code]`；元件 `auth/*`、`member/*`、`patient/*`、`join/*`。
- Google 登入：`GoogleSignInButton.svelte` 直接載 `https://accounts.google.com/gsi/client`，client id 用 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`，回呼拿 `credential` 交 `getAuth().loginWithGoogle`。Apple：`AppleSignInButton.svelte` 載 Apple JS SDK，`usePopup: true`，回傳 `id_token` 與 `user.name` 交 `loginWithApple`。設定值逐一取自舊 `social-login-buttons.tsx`。
- 前置：請使用者把 preview 網域加入 Google OAuth「已授權 JavaScript 來源」與 Apple Services ID Return URL（或改用固定的 staging alias）。
- 煙霧：Email 登入、Google、Apple、登出、token 過期提示、`/join` 申請寄信成功。

---

## 第 3 期：後台與其他（Task 13–14 彼此獨立，可平行）

### Task 13: 院所後台
- 路由 `admin/**` 共 10 頁，皆 `ssr = false`；元件 `admin/*`、`layout/*`、`platform/*`；`use-poll-on-visible` → `src/lib/hooks/poll-on-visible.svelte.ts`。
- 群組大，拆 3 次 commit：(a) login / 首頁 / dashboard；(b) clinics、clinics/[id]（含所有 tab 與 dialog、logo 上傳）；(c) analytics、applications、settings、subscription、users。
- 截圖需 `PARITY_TOKEN`（superadmin 與一般院所帳號各一組）。
- 煙霧：logo 上傳（驗證 multipart 經 rewrite 正常）、代訂、叫號台、患者檔案、試用開通。

### Task 14: 叫號看板與開發者文件
- `/display/[facilityId]`（公開、遮罩姓名、輪詢）；`/developers`、`/developers/docs/[slug]`：Markdown 以 `marked` 在 `+page.server.ts` 轉 HTML，GFM 開啟，`{@html}` 輸出。

---

## 第 4 期：切換

### Task 15: 全面驗證與切換
- [ ] **Step 1:** `routes.json` 涵蓋全部 36 頁；`seo-diff.mjs`（全部群組）0 差異；`screenshot.mjs` 全部群組人工確認；`pnpm test`、`pnpm check`、`pnpm lint` 全過；Snyk code scan 乾淨。
- [ ] **Step 2:** 向使用者報告結果並**取得切換同意與時段**（低流量時段）。
- [ ] **Step 3:** 使用者同意後 merge `sveltekit` → main、push；部署完成後對正式站跑 seo-diff（新正式站 vs 前一個 Next deployment 的 URL）與煙霧（登入、預約、後台、上傳、寄信）。
- [ ] **Step 4:** 失敗 → Vercel Instant Rollback 到最後一個 Next deployment，回報。
- [ ] **Step 5:** 成功 → 更新 `web/CLAUDE.md`（技術棧、指令、結構、`$lib` alias、UI 慣例改「先 shadcn-svelte，找不到再參考 Luma 移植」）與上層 `Cross/CLAUDE.md` 子專案表；`git worktree remove ../web-next-ref`；commit `docs: 更新為 SvelteKit 架構說明`。
