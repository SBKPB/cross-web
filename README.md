# Cross Web

產品主軸為線上預約與院所營運管理：民眾搜尋院所、預約看診／諮詢／療程，院所管理服務、人員、排班與候診。開發者文件保留為次要技術資源。

SvelteKit 2 / Svelte 5 網站，包含公開頁面、預約、會員、院所後台、叫號看板與開發者文件。路由、登入狀態與 API 代理由 SvelteKit 管理；複雜後台透過僅在後台載入的 React 相容層保留既有操作。沒有 Next.js 執行階段。

正式網站：<https://cross.twinhao.com>。發布與驗收詳見上層 `docs/deployment-sveltekit-2026-10-23.md`；相容層範圍與後續原生化工作見 [後台相容層](docs/admin-compatibility.md)。

## 本機開發

```sh
pnpm dev
```

開啟 http://localhost:5173。Vite 將 `/api/v1/*` 代理至本機後端 `http://localhost:8001`。

頁面位於 `src/routes/`，業務邏輯、型別與元件位於 `src/lib/`。部署時的後端代理位於 `src/routes/api/v1/[...path]/+server.ts`。

## 檢查與建置

本機已驗證 Node 22；Vercel 使用 Node 24，套件管理器固定 pnpm 10.34.5。預設環境的 Node 26 不受目前 Vercel adapter 支援；執行前先確認實際 Node 版本。

```sh
pnpm check
pnpm lint
pnpm build
pnpm test
```

測試包含虛構 API 回應及無頭 Chrome 案例，需要允許啟動本機測試伺服器。預設 Chrome 路徑為 macOS 的 Google Chrome，可用 `CHROME_PATH` 覆寫。建置產物不存在或比來源舊時，整合測試會明確失敗。

`PREVIEW_URL` 未設定時，遠端 API 代理檢查會略過；本機測試不代表已驗證正式部署。

## 遷移與發布

[原遷移計畫](docs/superpowers/plans/2026-10-19-sveltekit-migration.md) 保留為歷史設計。這次以 React 相容層保留完整後台，尚未完成計畫中的全原生 Svelte 後台改寫。正式部署先產生不切換網域的 production 候選版本，驗收後提升同一份產物。
