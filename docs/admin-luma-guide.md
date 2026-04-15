# Admin Luma UI Guide

後台管理介面的 Luma shadcn/ui 設計規則。所有 `/admin/*` 相關頁面與 `src/components/admin/**` 元件都必須遵循。

## 核心原則

1. **直接使用 shadcn primitives**（`@/components/ui/*`），不要另外封一層 wrapper
2. **從 `@/lib/admin/luma-styles` import className 常數**套到 shadcn 元件上
3. **使用 Luma token，禁用 slate-\***
4. **互動元素必帶 hover 微互動**（`hover:-translate-y-1` / `hover:ring-primary/20`）

---

## 用法範例

> **重要**：shadcn `<Card>` 本身已套用 Luma baseline（`rounded-4xl`、`bg-card`、`ring-1 ring-foreground/5`、`shadow-md`）。**不要**再疊 `lumaCard` 上去。只有在用純 `<div>` 建立 card 樣式時才套 `lumaCard`。

```tsx
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { lumaCardHover, lumaPageContainer } from "@/lib/admin/luma-styles";

export default function Page() {
  return (
    <div className={lumaPageContainer}>
      {/* 可點擊卡片：Card + hover 類別 */}
      <Card className={cn("cursor-pointer", lumaCardHover)}>
        <CardHeader>
          <CardTitle>標題</CardTitle>
        </CardHeader>
        <CardContent>內容</CardContent>
      </Card>

      {/* 純 div 的內層區塊：用 lumaCardInner */}
      <div className={lumaCardInner}>
        <p>次級資訊卡</p>
      </div>
    </div>
  );
}
```

**`lumaPageContainer` 的作用**：提供 `mx-auto max-w-7xl space-y-6`。shell 的 `<main>` 已經有 padding，頁面只負責 max-width 與垂直間距。

表格外框：

```tsx
import { Table } from "@/components/ui/table";
import { lumaTableShell } from "@/lib/admin/luma-styles";

<div className={lumaTableShell}>
  <Table>...</Table>
</div>
```

Page header 直接寫 JSX：

```tsx
<div className="flex items-start justify-between">
  <div className="space-y-1">
    <h1 className={lumaSectionTitle}>院所管理</h1>
    <p className={lumaSectionDesc}>管理所有院所資料</p>
  </div>
  <Button>新增院所</Button>
</div>
```

空狀態用共用元件（有 icon badge + action slot 的結構）：

```tsx
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { Building2 } from "lucide-react";

<AdminEmptyState
  icon={Building2}
  title="尚無院所資料"
  description="點擊右上角新增院所開始建立"
  action={<Button>新增院所</Button>}
/>
```

---

## 全域禁用清單

```
slate-*              → foreground / muted-foreground / muted
bg-white             → bg-background / bg-card
border-slate-*       → border-border 或 ring-1 ring-foreground/5
from-slate-*         → 不用 gradient，改 bg-background
text-slate-*         → text-foreground / text-muted-foreground
text-red-*           → text-destructive
rounded-md（外層 card）→ rounded-2xl / rounded-3xl / rounded-4xl
單獨 hover:shadow-md → 配 ring + translate
```

---

## Luma 標準寫法對照表

| 元素 | 常數 | 實際 className |
|---|---|---|
| Page shell | `lumaPageShell` | `min-h-screen bg-background` |
| Page container | `lumaPageContainer` | `container mx-auto px-4 py-8 space-y-6` |
| Primary card | `lumaCard` | `bg-card rounded-4xl p-6 shadow-sm ring-1 ring-foreground/5` |
| Card hover | `lumaCardHover` | `transition hover:shadow-xl hover:ring-primary/20 hover:-translate-y-1` |
| Inner card | `lumaCardInner` | `bg-card rounded-2xl p-5 ring-1 ring-foreground/5` |
| Table shell | `lumaTableShell` | `rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 overflow-hidden` |
| Table header | `lumaTableHeader` | `bg-muted/40 [&_th]:text-muted-foreground [&_th]:font-medium` |
| Row hover | `lumaTableRowHover` | `hover:bg-muted/30 transition` |
| Icon badge | `lumaIconBadge` | `inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary` |
| TabsList | `lumaTabsList` | `bg-muted/50 rounded-full p-1` |
| TabsTrigger active | `lumaTabsTrigger` | `data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:rounded-full` |
| Dialog footer | `lumaDialogFooter` | `gap-2 sm:gap-3 sm:justify-end` |
| Selectable item | `lumaSelectableItem` | `rounded-2xl ring-1 ring-foreground/5 p-4 hover:ring-primary/20 transition` |
| 主標題 | `lumaSectionTitle` | `text-2xl font-semibold tracking-tight text-foreground` |
| 副文字 | `lumaSectionDesc` | `text-sm text-muted-foreground` |

---

## Badge 與 Loading 處理

```tsx
// Badge：永遠用 variant，不要手刻 bg + text
<Badge variant="secondary">已確認</Badge>
<Badge variant="outline">待處理</Badge>
<Badge variant="destructive">已取消</Badge>

// Loading spinner
<div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />

// 錯誤文字
<p className="text-destructive">{error}</p>
```

---

## 常見反模式

```tsx
// ❌ 手刻 slate 色階
<div className="bg-slate-100 text-slate-800 rounded-md border border-slate-200">

// ✅ 用 Luma token
<div className={lumaCardInner}>
```

```tsx
// ❌ Badge 手刻改色
<Badge className="bg-blue-100 text-blue-800">已確認</Badge>

// ✅ 用 variant
<Badge variant="secondary">已確認</Badge>
```

```tsx
// ❌ loading spinner 硬編碼顏色
<div className="border-slate-200 border-t-blue-600 animate-spin rounded-full" />

// ✅ 用 token
<div className="border-muted border-t-primary animate-spin rounded-full" />
```

```tsx
// ❌ 在 shadcn Card 上再疊一層抽象
export function LumaCard({ children }) {
  return <Card className="...">{children}</Card>;
}

// ✅ 直接用 shadcn Card + className 常數
<Card className={cn(lumaCard, lumaCardHover)}>{children}</Card>
```

---

## 驗收指令

PR 合併前在 web 目錄跑：

```bash
grep -rn "slate-" src/app/admin src/components/admin
grep -rn "bg-white" src/app/admin src/components/admin
grep -rn "from-slate" src/app/admin src/components/admin
```

三個指令都應回傳 0 行。
