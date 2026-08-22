"use client";

import { ArrowRight, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { inkOn } from "@/lib/color-contrast";

interface StickySubmitButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  primaryColor?: string;
  className?: string;
  /** 按鈕上方的輔助提示（如目前選取摘要） */
  hint?: string;
}

export function StickySubmitButton({
  label,
  onClick,
  disabled = false,
  isLoading = false,
  primaryColor = "#1d4ed8",
  className,
  hint,
}: StickySubmitButtonProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3",
        "glass-bar border-t border-border/60",
        className,
      )}
    >
      <div className="mx-auto max-w-2xl">
        {hint && (
          <p className="mb-2 truncate text-center text-xs text-muted-foreground">
            {hint}
          </p>
        )}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || isLoading}
          className={cn(
            "group/button inline-flex h-12 w-full items-center justify-center gap-2",
            "rounded-2xl text-base font-semibold",
            "shadow-lg transition-all",
            "hover:brightness-105 active:translate-y-px",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
          style={{ backgroundColor: primaryColor, color: inkOn(primaryColor) }}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              處理中…
            </>
          ) : (
            <>
              {label}
              <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
