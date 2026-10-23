# CLAUDE.md

## 目前架構（2026-10-23）

Cross Web 使用 SvelteKit 2 / Svelte 5，UI 一律繁體中文。正式網址 https://cross.twinhao.com，發布紀錄位於上層 `docs/deployment-sveltekit-2026-10-23.md`。

- 路由：`src/routes/`；共用程式、型別、元件：`src/lib/`，匯入別名 `$lib/*`。
- 公開頁、預約、會員、開發者文件、看板使用 Svelte。UI 使用 Svelte 5 runes、Tailwind 4、shadcn-svelte / Bits UI，沿用既有設計 tokens。
- 後台：`src/lib/admin-compat/` 保留 React 19 / Radix UI 元件，以客戶端相容層掛載。由 SvelteKit 控制路由、權限、共用登入狀態與主題；沒有 Next.js 執行階段。詳見 `docs/admin-compatibility.md`。
- API 代理：`src/routes/api/v1/[...path]/+server.ts`；本機 Vite proxy 指向 `http://localhost:8001`。`BACKEND_URL` 為伺服器變數，`NEXT_PUBLIC_` 前綴沿用既有公開變數。
- 登入與主題沿用 `access_token` / `refresh_token` / `theme` 儲存鍵；不要建立另一份 React token 狀態。
- 需登入頁面關閉 SSR。公開文件與公開頁保留 SSR 與 SEO；看板使用遮罩姓名並設 noindex。
- Vercel 專案 `cross-web`，`vercel.json` 指定 `sveltekit`，區域 `sin1`，Node 24。先 staged production 驗收，再 promote 相同產物。

## 開發與驗證

- Node 22 或 24；pnpm 10.34.5。Node 26 不受目前 Vercel adapter 支援。
- `pnpm dev`，預設 http://localhost:5173。
- `pnpm check`、`pnpm lint`、`pnpm build`、`pnpm test`。瀏覽器測試前先建置，允許本機測試伺服器與無頭 Chrome；測試會拒絕過期產物。
- `pnpm preview`。唯讀正式 API 驗收需明確覆寫本機的 `BACKEND_URL`，不可拿 `.env.local` 的本機後端結果當正式資料。
- 所有寫入驗收使用虛構 API 或隔離測試環境，不對正式病人／預約資料做測試寫入。
- 原遷移設計：`docs/superpowers/plans/2026-10-19-sveltekit-migration.md`。React 後台原生化尚未完成，不可將歷史計畫全部標成完成。

## 領域模型

型別位於 `src/lib/types/clinic.ts`。`Clinic` 含院所、成員、服務與訂閱設定。

- `HospitalLevel`: medical_center / regional_hospital / district_hospital / clinic。
- `FacilityType`: healthcare（看診，含健保與自費）/ aesthetic（醫美）/ beauty（美容）/ other（其他）。
- `PaymentType`: nhi / self_pay / both，與服務分類分開。
- `MedicalDepartment`: 18 個台灣醫療科別，需與後端及行動端一致。

## UI 與輸出

新增畫面與視覺更新優先使用 Luma shadcn/ui registry 的 blocks / components，沿用專案設計 tokens；沒有對應元件才自建。Svelte 元件位於 `src/lib/components/`，後台舊元件位於相容層內，避免混淆兩種元件。

對話、文件、註解與 commit message 一律繁體中文。

## Security

Run Snyk code scanning on new first-party code. Fix any issues found and rescan until clean.
