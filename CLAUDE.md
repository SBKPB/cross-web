# CLAUDE.md

## 產品主軸

Cross 以「線上預約與院所營運管理」為核心，優先完成醫美院所的諮詢與療程預約導入及付費驗證。民眾找院所／預約與院所導入是主要入口；開發者文件、設備與 API 為次要擴充，不可將預約描述為參考應用或附加能力。

## 目前架構（2026-10-23）

Cross Web 使用 SvelteKit 3.1 / Svelte 5，UI 一律繁體中文。正式網址 https://cross.twinhao.com，發布紀錄位於上層 `docs/deployment-sveltekit-2026-10-23.md`。

- 路由：`src/routes/`；共用程式、型別、元件：`src/lib/`，匯入採用 `package.json` 的 `#lib/*` subpath imports（含副檔名）。
- 公開頁、預約、會員、開發者文件、看板使用 Svelte。UI 使用 Svelte 5 runes、Tailwind 4、shadcn-svelte / Bits UI，沿用既有設計 tokens。
- 院所工作區：`src/lib/components/admin/workspace/`，今日工作台、預約、叫號、排班（含批次）及客戶清單使用原生 Svelte 5。`AdminPage.svelte` 在掛載前檢查院所歸屬與角色。
- 完整原生後台：`src/lib/components/admin/manage/` 包含登入、平台管理、院所／Logo、人員／照片／服務對應／休假、服務、公告、客戶完整檔案、分析、訂閱與修改密碼。React／Radix React 依賴、JSX 設定及 `admin-compat/` 已移除。完整範圍見 `docs/admin-compatibility.md`。
- API 代理：`src/routes/api/v1/[...path]/+server.ts`；本機 Vite proxy 指向 `http://localhost:8001`。`BACKEND_URL` 為伺服器變數，`src/env.ts` 明確宣告允許公開的既有 `NEXT_PUBLIC_` 變數，私密後端網址不會進入瀏覽器。
- 登入與主題沿用 `access_token` / `refresh_token` / `theme` 儲存鍵；不要建立另一份 React token 狀態。
- 需登入頁面關閉 SSR。公開文件與公開頁保留 SSR 與 SEO；看板使用遮罩姓名並設 noindex。
- 框架設定：`vite.config.ts` 的 `sveltekit(...)`，SvelteKit 3 不使用 `svelte.config.js`；TypeScript extends `$app/tsconfig`。
- Vercel 專案 `cross-web`，`vercel.json` 指定 `sveltekit`，區域 `sin1`，Node 24。先 staged production 驗收，再 promote 相同產物。

## 開發與驗證

- Node 22.17 以上或 24；pnpm 10.34.5。Node 26 不受目前 Vercel adapter 支援。
- `pnpm dev`，預設 http://localhost:5173。
- `pnpm check`、`pnpm lint`、`pnpm build`、`pnpm test`。瀏覽器測試前先建置，允許本機測試伺服器與無頭 Chrome；測試會拒絕過期產物。
- `pnpm preview`。唯讀正式 API 驗收需明確覆寫本機的 `BACKEND_URL`，不可拿 `.env.local` 的本機後端結果當正式資料。
- 所有寫入驗收使用虛構 API 或隔離測試環境，不對正式病人／預約資料做測試寫入。
- 原遷移設計：`docs/superpowers/plans/2026-10-19-sveltekit-migration.md`。歷史計畫保留原紀錄；目前全面原生化範圍與測試以 `docs/admin-compatibility.md` 為準。

## 領域模型

型別位於 `src/lib/types/clinic.ts`。`Clinic` 含院所、成員、服務與訂閱設定。

- `HospitalLevel`: medical_center / regional_hospital / district_hospital / clinic。
- `FacilityType`: healthcare（看診，含健保與自費）/ aesthetic（醫美）/ beauty（美容）/ other（其他）。
- `PaymentType`: nhi / self_pay / both，與服務分類分開。
- `MedicalDepartment`: 18 個台灣醫療科別，需與後端及行動端一致。

## UI 與輸出

新增畫面與視覺更新優先使用 Luma shadcn/ui registry 的 blocks / components，沿用專案設計 tokens；沒有對應元件才自建。Svelte 元件位於 `src/lib/components/`，後台元件集中於 `admin/workspace/` 與 `admin/manage/`，避免重新引入 React 相容層。

對話、文件、註解與 commit message 一律繁體中文。

## Security

Run Snyk code scanning on new first-party code. Fix any issues found and rescan until clean.

## 預約工作區規則

- 可用時段依已授權的班表、休假、院所營業時間與預約時長快照計算，改期需排除原預約；送出仍由後端鎖定並檢查衝突。不得將前端時段計算當作授權或交易邊界。
- 列表失敗不得顯示成無預約；保留舊資料時標示更新時間。取消、未到與完成服務必須核對客戶與時段，409 等錯誤應在介面顯示。
- 日期、人員、服務、狀態與頁籤以網址保留；客戶姓名／電話搜尋留在元件狀態，不新增到工作區網址。
- 瀏覽器寫入驗收均攔截 API 並使用虛構資料；`ADMIN_WORKSPACE_ORIGIN` 可驗收部署頁面，所有 API 仍被測試替身攔截。
