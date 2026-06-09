"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// 三態主題：亮 / 暗 / 跟隨系統
const THEME_OPTIONS = [
  { value: "light", label: "亮色", icon: Sun },
  { value: "dark", label: "暗色", icon: Moon },
  { value: "system", label: "跟隨系統", icon: Monitor },
] as const;

/**
 * 主題切換入口（Popover 下拉，三態）。
 * 以 mounted 守衛避免 server/client 不一致造成的 hydration mismatch。
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 尚未掛載前先渲染中性佔位，保持 layout 不跳動且不洩漏錯誤主題
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="切換主題"
        className={cn("text-foreground", className)}
        disabled
      >
        <Sun className="size-4" />
      </Button>
    );
  }

  // 按鈕圖示反映「實際呈現」的主題（system 會解析成 light/dark）
  const showMoon = resolvedTheme === "dark";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="切換主題"
          className={cn(
            "text-foreground hover:text-primary",
            className,
          )}
        >
          {showMoon ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1.5">
        <div className="flex flex-col">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{opt.label}</span>
                {active && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
