# 共用日期選取器

全站表單使用 `src/lib/components/ui/date-input/DateInput.svelte`，由既有 shadcn-svelte Input、Button、Popover、Calendar 與 Select 組合。不得新增瀏覽器原生 `date`、`datetime-local`、`month` 或 `week` 欄位。

日期保持 `YYYY-MM-DD` 日曆日字串，不轉成 UTC 時間。支援 `bind:value`、`onchange`、`required`、`min`、`max`、`disabled`、`readonly`、既有標籤與欄位名稱；選日立即觸發原本的篩選或時段更新。可手動輸入完整日期，無效日期顯示中文提示並阻擋原生表單送出。

生日欄位指定 `purpose="birthday"`，年份由新到舊，最大日期為台北今日。一般日期由早到晚；可用最小／最大日期依各流程限制。年份及月份選單使用專案 Select，日曆支援鍵盤方向鍵、Enter、Escape，關閉後焦點回到欄位。彈窗限制在手機視窗範圍，沿用亮暗色設計 tokens。

適用範圍為預約篩選、叫號日期、排班與批次排班、新增／改期預約、休假、訂閱與續約、會員資料及看診對象生日，共 16 處。公開預約頁原有的自訂日期元件只顯示後端開放日期，繼續沿用該流程。

`tests/date-input.test.mjs` 驗證日期解析、範圍與閏年、元件互動、巢狀彈窗、鍵盤、手機與亮暗色；`tests/date-input-pages.test.mjs` 實際打開上述 16 個欄位，並確認篩選網址、改期可用時段及焦點還原。所有 API 以虛構資料攔截，部署驗收可指定 `DATE_INPUT_ORIGIN` 與 `DATE_INPUT_EVIDENCE_DIR`。
