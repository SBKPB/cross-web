import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * 邊框刻意偏離 Luma registry 預設的 border-transparent：填色 bg-input/50 疊在
 * 卡片／面板上只有 1.1:1，未聚焦時等於沒有邊界（放在 bg-muted 面板上尤其明顯）。
 * foreground/50 是亮暗兩色皆過 WCAG 1.4.11 3:1 的最低值，詳見 ui/checkbox.tsx。
 * 填色維持 bg-input/50 不要改成 bg-card——Dialog 底色本身就是白色，改了會變 1.0:1。
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none rounded-2xl border border-foreground/50 bg-input/50 px-4 py-3 text-base transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
