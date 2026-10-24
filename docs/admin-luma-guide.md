# 後台 shadcn-svelte／Luma 元件指南

2026-10-23：後台使用 SvelteKit 3.1、Svelte 5 與 shadcn-svelte／Bits UI；沿用專案 Luma registry 與 Cross 品牌語意色。使用者所指的 Skeleton 是 shadcn 的載入占位元件，並非 Skeleton UI 元件庫；專案沒有 `@skeletonlabs/*` 依賴。

## 元件與版型

- `admin/layout/AdminFrame.svelte`：共用院所與平台管理外框。桌面可收合側欄、手機 Sheet 選單、目前院所／使用者、修改密碼、登出及主題切換。
- `admin/layout/AdminSkeleton.svelte`：使用 `ui/skeleton` 組合儀表板、卡片、清單、表格、表單、班表與時段的載入占位。
- `admin/manage/Modal.svelte`：共用 Dialog 標題與說明、可捲動表單區與送出期間關閉保護。
- `ui/field`：Field、Label、Set 與 Legend，控制項須保留唯一 id 與明確 label 關聯。
- `ui/native-select`：原生選單操作與專案表單樣式，保留鍵盤、手機原生選單及既有值綁定。
- Card、Table、Avatar、Badge、Button、Input、Textarea、Checkbox、Tabs、Dialog、Sheet 與 Empty 由 `src/lib/components/ui/` 匯入。

不新增 React 或 Radix React 元件。新增 UI 優先取用既有 shadcn-svelte／Luma 元件，避免用全域 CSS 重製控制項。

## 側邊欄

- 院所導覽依「日常作業、客戶與營運、設定與帳務」分組，平台管理使用原有平台分組。品牌入口回到目前工作區的工作台，平台管理員不會因此遺失所選院所。
- 768–1023px 預設 80px 窄版；1024px 以上預設完整側欄。使用者可透過頁首按鈕切換，偏好保存於 `cross_admin_sidebar_collapsed`。儲存受限時仍可操作。
- 窄版保留可辨識圖示、完整無障礙名稱、滑鼠標題與鍵盤焦點；目前頁面使用側欄語意色底板、文字與左側標記，並設定 `aria-current="page"`。
- 手機始終使用完整文字選單，不受桌面收合偏好影響。換頁或放大至桌面寬度會關閉 Sheet，避免遮罩留在畫面上；底部「更多」標示其他管理頁面的所在位置。
- 只有功能清單可獨立捲動，院所情境與帳戶操作保留固定位置。長院所名稱與使用者名稱截斷並提供完整標題。

## 載入與錯誤

```svelte
<script lang="ts">
  import AdminSkeleton from '../layout/AdminSkeleton.svelte';
  let loading = $state(true);
  let error = $state('');
</script>

{#if loading}
  <AdminSkeleton label="載入人員中…" variant="cards" />
{:else if error}
  <p role="alert">{error}</p>
{:else}
  <!-- 呈現已取得的資料 -->
{/if}
```

骨架只在等待資料時顯示，不能把載入失敗或空資料呈現成持續載入。保留舊資料的重新整理，應沿用更新時間及忙碌狀態。骨架以 `aria-busy` 和單一狀態文字告知輔助工具，占位圖形本身隱藏；使用者偏好減少動態時停止脈動動畫。

## 表單與確認

使用 Field.Label 搭配 Input／Checkbox 的唯一 id。新增與編輯維持既有 API 契約、資料驗證、錯誤後保留輸入及部分成功重試機制；儲存、停用與刪除等業務規則不能因視覺調整而改變。

長表單的動作列使用 `Dialog.Footer class="admin-dialog-footer"`，捲動內容與手機安全區內仍可使用儲存及取消。不要直接以全域 selector 重寫 Input／Select／Textarea 的圓角、顏色或焦點規則。

## 驗收

執行型別檢查、lint、正式建置與完整測試；寫入驗收使用虛構 API。`tests/admin-skeleton.test.mjs` 驗證慢速載入、錯誤結束與重試、減少動態、手機選單與暗色模式。既有完整後台與日常工作區測試保護預約、身分資料、訂閱及權限。

## 頁籤與操作流程檢查（2026-10-23）

- Tab 選取底色應立即切換為品牌色，避免背景過渡期間難以辨認；保留明確底板與鍵盤焦點。
- Tabs.List 使用自然高度；手機設定採兩欄排列，不以單行固定高度搭配換行。每組 Tab 均需有 Tabs.Content，讓選取項與內容透過 ARIA 關聯。
- 設定頁籤保留瀏覽器歷史；院所內的工作台與訂閱導覽需維持所選院所，平台管理員亦同。
- 隱藏篩選需提供已套用摘要與清除入口，清除不應重設所選日期；客戶搜尋不得寫進網址。
- 空清單需說明原因與下一步，分辨尚無資料與篩選無結果。
- `admin/reveal-error.ts` 會將新錯誤捲入表單可視範圍並聚焦，不清除使用者輸入。
- 預約送出中不可透過 Esc／遮罩誤關閉；停用的建立按鈕需提供下一步說明。啟用一次性試用需先確認。
- 手機後台的按鈕、頁籤與圖示按鈕保留至少 44px 的點擊高度。
- `tests/admin-usability.test.mjs` 保護上述互動行為與行程取消狀態。
