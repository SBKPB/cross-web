# 後台相容層（2026-10-23）

本次由 SvelteKit 接管網站及正式部署，開發者頁與叫號看板為原生 Svelte。院所後台保留原有 React 元件，避免在上線切換時一次重寫複雜管理操作。這不是全原生 Svelte 後台。

## 邊界

- `src/routes/admin/` 為 SvelteKit 路由，關閉 SSR。
- `AdminPage.svelte` 掛載前檢查管理角色與院所歸屬，再動態載入對應頁面；後端仍獨立驗證授權。
- `src/lib/admin-compat/runtime.tsx` 掛載 React root；路由離開時卸載，非後台頁面不載入此執行階段。
- `auth.ts` 直接橋接既有 Svelte 登入狀態；`navigation.ts`、`link.tsx`、`image.tsx`、`theme.ts` 接到 SvelteKit 導覽與共用主題。沒有 Next.js 依賴或第二份登入狀態。
- `legacy/` 元件來自既有正式版 `546d950` 的後台依賴圖，保留管理員、院所、人員、排班、公告、患者、叫號、分析及訂閱等操作。

## 已驗證

使用虛構 API 的瀏覽器測試涵蓋登入／登出、系統管理頁、院所所有分頁、編輯視窗、multipart Logo 上傳，以及院所帳號無權存取其他院所／系統頁時不發送頁面請求。原有 API 代理、共用登入、主題與民眾預約測試一併保留。

手機版檢查涵蓋後台登入與開發者頁寬度；公開文件與看板檢查頁面標題、SSR、未知文件 404、遮罩姓名及 noindex。

## 後續原生化

逐頁將 `legacy/` 移至原生 Svelte，保留相同權限、路由、API 與驗收案例；每一頁功能與操作通過後才移除相應 React 元件。最後一頁移除後，才能刪除相容層與 React / Radix 依賴。原遷移計畫中的「移除全部 React」仍屬後續工作。
