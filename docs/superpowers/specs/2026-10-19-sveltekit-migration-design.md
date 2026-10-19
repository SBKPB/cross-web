# web 遷移至 SvelteKit 設計

- 日期：2026-10-19
- 範圍：`web/`（民眾端 + 院所後台）。後端 FastAPI 不變。

## 目標與成功標準

把 Next.js 16 + React 19 換成 SvelteKit（Svelte 5），目的為整體技術棧更好維護。

成功標準：
1. 全部 36 個頁面、3 個 API route、sitemap/robots/OG 圖在 SvelteKit 上功能等同。
2. SEO 零退步：每條公開路由 `<head>`（title/description/canonical/OG）與 JSON-LD 與舊版一致；sitemap URL 數一致。
3. 視覺等同：每條路由淺色 / 深色 / 手機寬三張截圖與舊版比對無非預期差異。
4. 切換後可在數秒內回滾。

## 策略：單分支、一次切換

- 同一 repo（SBKPB/cross-web）開 `sveltekit` 分支，**原地**把 Next app 換成 SvelteKit。不做 monorepo、不抽共用套件、不開第二個 Vercel 專案。
- `vercel.json` 加 `"framework": "sveltekit"`，分支自動得到 preview 網址；所有驗證在 preview 上做。
- 分支內工作順序：靜態頁 → 民眾端 → 後台（見「分期」）。
- merge 進 main = 切換。回滾 = Vercel Instant Rollback 到最後一個 Next deployment。
- **前置條件**：main 目前未 commit 的改動先 commit；搬遷期間 web 凍結新功能（hotfix 例外，需同步補進分支）。

## 架構

### 技術選擇
| 項目 | 選擇 |
|---|---|
| 框架 | SvelteKit 2 + Svelte 5（runes）+ `@sveltejs/adapter-vercel`，region `sin1` |
| 樣式 | Tailwind 4，沿用現有 `globals.css`（tokens / 主題 / 字體） |
| UI 基礎元件 | shadcn-svelte（Bits UI）對應現有 20 個 `components/ui` |
| 圖示 | `@lucide/svelte` |
| 深色模式 | `mode-watcher`，沿用 next-themes 的 localStorage key 與 `class` 策略，既有使用者偏好不遺失 |
| 月曆 | shadcn-svelte Calendar |
| Markdown（developers 文件） | `marked`，server 端渲染（內容為自家文件） |
| Google / Apple 登入 | 直接載入 GIS / Apple JS SDK，各包一個小元件 |
| 不變 | `qrcode`、`date-fns`、`clsx`、`tailwind-merge`、`class-variance-authority` |
| 環境變數 | `kit.env.publicPrefix = 'NEXT_PUBLIC_'`，沿用現有變數名，Vercel 不需重設 |

### 後端連線
- **刪除 `/api/[...path]` 代理**，改用 `vercel.json` rewrite `/api/v1/:path*` → Cloud Run 後端（edge 轉發，無 function、少一跳）。原 multipart buffer workaround 隨之消失；logo / 頭像上傳須在 preview 實測。
- 本地開發用 Vite `server.proxy` 把 `/api/v1` 轉到本地後端（8001）。
- `/api/join`（Resend 寄信）、`/api/track-view` 改為 `src/routes/api/join/+server.ts`、`src/routes/api/track-view/+server.ts`。rewrite 只匹配 `/api/v1/*`，不會吃到這兩條。

### API 層
- `src/lib/api`、`src/types`、`src/lib/constants`、`src/lib/validation` 等純 TS 檔直接搬到 SvelteKit 的 `src/lib/`，`@/` import 改 `$lib/`。
- client 加可選 `fetch` 參數：server `load` 傳 SvelteKit 的 `fetch`，瀏覽器端不傳。
- 移除 `next: { revalidate }`；快取改由頁面 `setHeaders` 控制（見下）。

### 資料抓取與快取
- **公開 / SEO 頁**（首頁、clinic、area、specialty、search、pricing 等）：`+page.server.ts` `load` 在 server 端渲染。
- 原 ISR 改 CDN 快取：`setHeaders({ 'cache-control': 'public, s-maxage=<秒>, stale-while-revalidate' })`，秒數沿用現值（落地頁 / sitemap 3600、診所 300）。
- **需登入頁**（member、booking、admin、auth/complete-profile）：token 在 localStorage，設 `export const ssr = false`，client 端抓資料，與現行為一致。

### Auth
- token 續存 localStorage；silent refresh 邏輯隨 API client 原樣搬入。
- `AuthProvider` → Svelte context + rune class；頁面保護維持 client 端。
- 現行 `middleware.ts` 為空殼，不搬。

### SEO
- `generateMetadata`（4 處）→ `load` 回傳 meta，共用 `<Seo>` 元件以 `<svelte:head>` 輸出；JSON-LD 沿用 `serialize-json-ld.ts`（含注入防護）。
- `sitemap.ts` / `robots.ts` → `src/routes/sitemap.xml/+server.ts`、`src/routes/robots.txt/+server.ts`。
- 全站預設 OG 圖 → `static/og.png`（由現行生成結果存檔）。
- 診所專屬 OG 圖（有 logo 用 logo、中文用 Noto Sans TC 子集）→ `src/routes/clinic/[id]/og.png/+server.ts`，以 `@vercel/og` 重寫，視覺與現行一致。

### 元件
- 約 105 個業務元件跟著所屬頁面逐檔改寫為 Svelte 5，不預先整批轉。
- hooks：`use-poll-on-visible`、`use-service-taxonomy` → `.svelte.ts`；`use-favorites` → 共用 rune class。
- `next/link` → `<a>`；`next/navigation` → `$app/navigation` / `$app/state`；`next/image` → `<img loading="lazy">` 附寬高。

## 分期（皆在 `sveltekit` 分支內）

1. **骨架**：建 SvelteKit 專案、Tailwind + globals.css、shadcn-svelte 20 元件、主題、layout（header/footer）、API 層搬入、vercel.json rewrite、2 個 API route、terms / privacy / refund / pricing。preview 能部署並通過比對。
2. **民眾端**：首頁、clinic、area、specialty、search、sitemap/robots/OG → booking（含 success）→ auth / member / join / c/[code]。
3. **後台與其他**：admin 10 頁、display 叫號看板、developers 文件。
4. **切換**：全路由比對通過 → merge main → 正式站煙霧測試（登入、預約、後台、上傳、寄信）→ 刪除 Next 相關依賴與設定、更新 web/CLAUDE.md（含 Luma 慣例改為「先 shadcn-svelte，找不到再參考 Luma 移植」）。

第 2、3 期內各路由群組彼此獨立，可平行搬遷。

## 驗證

- **型別 / lint**：`svelte-check`、ESLint。
- **安全**：依 web/CLAUDE.md，新程式碼跑 Snyk code scan 至乾淨。
- **既有測試**：`tests/discovery-booking.test.mjs`、`tests/security.test.mjs` 改指向新路徑，`node --test` 跑。
- **視覺比對**：playwright-core + 系統 Chrome，對 `cross.twinhao.com` 與 preview 每條路由截淺色 / 深色 / 375px 三張；需登入頁注入 localStorage token。
- **SEO 比對**：腳本 curl 新舊版每條公開路由，diff `<head>` 與 JSON-LD；比對 sitemap URL 集合。
- **功能煙霧**：preview 上實測 Google / Apple 登入、預約流程、logo 上傳、`/join` 寄信、叫號看板。

## 風險

| 風險 | 對策 |
|---|---|
| 分支與 main 分歧 | 凍結 web 新功能；hotfix 同步補進分支；平行搬遷縮短期間 |
| Google / Apple 登入在 preview 網域失效 | 先把 preview 網域加入 OAuth 允許來源；必要時以正式網域的 staging alias 測 |
| `vercel.json` rewrite 被 adapter-vercel 的 catch-all function 搶先匹配 | 第 1 期第一件事就在 preview 驗證 `/api/v1/*` 確實打到後端；不行則退回 `+server.ts` 代理 |
| edge rewrite 對 multipart 行為不同 | preview 實測上傳；不行則退回 `+server.ts` 代理 |
| 切換後才發現問題 | Instant Rollback；切換時段選低流量時間 |

## 不做

- 不改後端、不改 API 契約。
- 不在此次導入 OpenAPI 型別自動產生（另案）。
- 不做 UI 改版；視覺以等同為準。
