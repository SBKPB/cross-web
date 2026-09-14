# Cross Web 安全掃描紀錄

掃描日期：2026-09-14。範圍為 `web/` 網站原始碼、完整套件依賴及三個正式 API 的未登入存取檢查。未包含獨立後端、iOS、Android、資料庫權限稽核或完整滲透測試。

## 結果

| 檢查 | 結果 |
| --- | --- |
| 套件漏洞初掃 | 32 筆：嚴重 2、高 19、中 10、低 1 |
| 套件漏洞複查 | 0 筆，掃描依賴數 749 |
| Snyk Code 1.1307.2 | 成功完成，223 個支援檔案（55 個 `.ts`、168 個 `.tsx`），0 項問題 |
| Semgrep CE 1.177.0 | 成功完成，224 個目標、61 條適用規則，解析錯誤 0；3 個稽核提示已人工核對 |
| 功能及安全回歸測試 | 7 項通過 |
| 變更檔案 ESLint、TypeScript、正式建置 | 通過 |
| 正式 API 未登入檢查 | 帳號、會員預約、院所管理清單均回傳 401 |

Snyk 使用單次 CLI 掃描。使用者明確同意將程式碼送往 Snyk，完成 CLI 登入後，啟用既有組織的 Snyk Code 功能。掃描副本只含程式檔案，未包含 `.env`、金鑰檔案、版本庫中繼資料、依賴或建置產物。沒有連結其他儲存庫或購買付費方案。

## 已修補

### 套件漏洞

- Next.js 與 eslint-config-next 從 16.2.12 升級至 16.3.5；影像處理依賴 sharp 更新至 0.35.4。
- 在既有相容範圍內更新 brace-expansion、js-yaml、fast-uri、hono、nanoid、qs 等間接依賴，未加入漏洞忽略清單。
- `pnpm audit --json` 複查所有嚴重程度均為 0。

兩筆嚴重公告分別涉及 [AVIF 影像最佳化遠端程式碼執行](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)及 [Windows 主機遠端程式碼執行](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36)。第二筆有 Windows 部署條件；套件掃描的版本命中並不代表目前 Vercel 環境已遭利用。

### 店家結構化資料的腳本注入

店家頁、地區頁及科別頁原先直接把動態資料序列化後放進 JSON-LD script。店家名稱、介紹等內容若含 HTML 結束標籤，單純 `JSON.stringify` 無法防止內容提前結束 script。

新增共用 `serializeJsonLd`，將 `<` 轉成 JSON Unicode 跳脫，再交給頁面輸出；全站四個 JSON-LD 輸出位置均使用它。此方式依循 [Next.js 官方 JSON-LD 安全指引](https://nextjs.org/docs/app/guides/json-ld)。測試以本機 React 伺服器渲染驗證大小寫混合結束標籤、額外 script、HTML 圖片標籤等輸入不能產生新標籤，同時確認中文與結構化資料可完整還原。未將測試內容寫入正式店家或資料庫。

Semgrep 的三個提示皆為上述動態 `dangerouslySetInnerHTML` 使用點。該稽核規則不辨識共用序列化函式的跳脫語意；逐項確認已使用安全函式，並由惡意輸入回歸測試及 Snyk 複查佐證。保留原始提示，沒有停用掃描規則或以忽略設定讓結果歸零。

## 驗證範圍與後續強化

- 正式 API 的無憑證 GET 請求：`/api/v1/auth/me`、`/api/v1/member/appointments`、`/api/v1/medical-facilities/` 均回傳 401，沒有讀取個人資料，也沒有建立預約。
- 首頁具有 HSTS。檢查時未回傳 CSP、X-Frame-Options、X-Content-Type-Options 或明確 Referrer-Policy；可在驗證登入、嵌入及外部服務相容性後規劃安全標頭強化。
- 現有登入權杖保存在 localStorage，因此防止同源腳本注入仍是重要要求；若改用 HttpOnly Cookie，需連同後端驗證與 CSRF 設計一起調整，本次沒有變更登入架構。
- 本次未測試登入後的跨帳號授權隔離。掃描結果表示此次工具與範圍未發現其他問題，不代表網站不存在任何安全風險。

## 重現方式

```sh
pnpm audit --json
node --test tests/*.test.mjs
pnpm build
```

本機程式碼掃描使用 `semgrep scan --oss-only --config p/security-audit --config p/secrets --metrics=off --disable-version-check`。Snyk 使用 `snyk code test` 掃描排除環境設定與金鑰的程式碼副本，沒有使用持續監控或結果發布選項。
