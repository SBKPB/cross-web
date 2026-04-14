"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface StickySubmitButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  primaryColor?: string;
  className?: string;
}

export function StickySubmitButton({
  label,
  onClick,
  disabled = false,
  isLoading = false,
  primaryColor = "#3b82f6",
  className,
}: StickySubmitButtonProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3",
        "bg-background/80 backdrop-blur-lg",
        "border-t border-border/60",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          "group/button inline-flex h-12 w-full items-center justify-center gap-2",
          "rounded-4xl bg-clip-padding text-base font-semibold text-white",
          "shadow-lg transition-all",
          "active:translate-y-px",
          "disabled:opacity-50 disabled:pointer-events-none",
        )}
        style={{ backgroundColor: primaryColor }}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            處理中…
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}
