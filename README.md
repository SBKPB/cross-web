# Cross Web

產品主軸為線上預約與院所營運管理：民眾搜尋院所、預約看診／諮詢／療程，院所管理服務、人員、排班與候診。開發者文件保留為次要技術資源。

SvelteKit 3.1 / Svelte 5 網站，包含公開頁面、預約、會員、院所後台、叫號看板與開發者文件。路由、登入狀態與 API 代理由 SvelteKit 管理；公開頁與全部後台均使用原生 Svelte；React、Radix React 與後台相容層已移除。

正式網站：<https://cross.twinhao.com>。發布與驗收詳見上層 `docs/deployment-sveltekit-2026-10-23.md`；完整功能範圍與驗收方式見 [後台全面原生化](docs/admin-compatibility.md)。

## 本機開發

```sh
pnpm dev
```

開啟 http://localhost:5173。Vite 將 `/api/v1/*` 代理至本機後端 `http://localhost:8001`。

頁面位於 `src/routes/`，業務邏輯、型別與元件位於 `src/lib/`。部署時的後端代理位於 `src/routes/api/v1/[...path]/+server.ts`。

## 檢查與建置

本機已驗證 Node 22.22；最低需要 Node 22.17，Vercel 使用 Node 24，套件管理器固定 pnpm 10.34.5。預設環境的 Node 26 不受目前 Vercel adapter 支援；執行前先確認實際 Node 版本。

```sh
pnpm check
pnpm lint
pnpm build
pnpm test
```

測試包含虛構 API 回應及無頭 Chrome 案例，需要允許啟動本機測試伺服器。預設 Chrome 路徑為 macOS 的 Google Chrome，可用 `CHROME_PATH` 覆寫。建置產物不存在或比來源舊時，整合測試會明確失敗。

`PREVIEW_URL` 未設定時，遠端 API 代理檢查會略過；本機測試不代表已驗證正式部署。

## 遷移與發布

[原遷移計畫](docs/superpowers/plans/2026-10-19-sveltekit-migration.md) 保留為歷史設計。全部後台路由與對話框已原生化，包含登入、平台管理、院所設定、人員、服務、公告、客戶完整檔案、分析、訂閱及日常預約／叫號／排班。正式部署先產生不切換網域的 production 候選版本，驗收後提升同一份產物。

SvelteKit 3 設定位於 `vite.config.ts`，匯入採 `#lib/*`（含副檔名），公開環境變數由 `src/env.ts` 明確列出。可用時段涵蓋營業時間、排班、休息、休假與既有預約快照，正式送出仍由後端再次驗證。
