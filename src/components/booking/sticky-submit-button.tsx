"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        "fixed inset-x-0 bottom-0 border-t bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
        className
      )}
    >
      <Button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        className="h-12 w-full text-base font-medium text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" />
            處理中...
          </>
        ) : (
          label
        )}
      </Button>
    </div>
  );
}
