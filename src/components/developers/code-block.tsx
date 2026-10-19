"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CodeBlock({
  code,
  label = "範例",
}: {
  code: string;
  label?: string;
}) {
  const [feedback, setFeedback] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setFeedback("copied");
    } catch {
      setFeedback("failed");
    }
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copy}
          aria-label={`複製${label}`}
        >
          {feedback === "copied" ? (
            <Check aria-hidden="true" />
          ) : (
            <Copy aria-hidden="true" />
          )}
          {feedback === "copied" ? "已複製" : "複製"}
        </Button>
      </div>
      <pre
        className="overflow-x-auto p-5 text-sm leading-7"
        tabIndex={0}
        aria-label={label}
      >
        <code>{code}</code>
      </pre>
      <p
        role="status"
        className={
          feedback === "failed"
            ? "px-5 pb-3 text-xs text-muted-foreground"
            : "sr-only"
        }
      >
        {feedback === "failed"
          ? "無法自動複製，請選取程式碼手動複製。"
          : feedback === "copied"
            ? "程式碼已複製。"
            : ""}
      </p>
    </div>
  );
}
