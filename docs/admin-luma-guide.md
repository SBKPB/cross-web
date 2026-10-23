# 後台 shadcn-svelte／Luma 元件指南

2026-10-23：後台使用 SvelteKit 3.1、Svelte 5 與 shadcn-svelte／Bits UI；沿用專案 Luma registry 與 Cross 品牌語意色。使用者所指的 Skeleton 是 shadcn 的載入占位元件，並非 Skeleton UI 元件庫；專案沒有 `@skeletonlabs/*` 依賴。

## 元件與版型

- `admin/layout/AdminFrame.svelte`：共用院所與平台管理外框。桌面固定側欄、手機 Sheet 選單、目前院所／使用者、修改密碼、登出及主題切換。
- `admin/layout/AdminSkeleton.svelte`：使用 `ui/skeleton` 組合儀表板、卡片、清單、表格、表單、班表與時段的載入占位。
- `admin/manage/Modal.svelte`：共用 Dialog 標題與說明、可捲動表單區與送出期間關閉保護。
- `ui/field`：Field、Label、Set 與 Legend，控制項須保留唯一 id 與明確 label 關聯。
- `ui/native-select`：原生選單操作與專案表單樣式，保留鍵盤、手機原生選單及既有值綁定。
- Card、Table、Avatar、Badge、Button、Input、Textarea、Checkbox、Tabs、Dialog、Sheet 與 Empty 由 `src/lib/components/ui/` 匯入。

不新增 React 或 Radix React 元件。新增 UI 優先取用既有 shadcn-svelte／Luma 元件，避免用全域 CSS 重製控制項。

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
