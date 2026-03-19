"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LINE_BRAND_COLOR } from "@/lib/constants/line-constants";

interface BindFormProps {
  isSubmitting: boolean;
  error?: string;
  onSubmit: (phone: string) => void;
}

const PHONE_REGEX = /^09\d{8}$/;

export function BindForm({ isSubmitting, error, onSubmit }: BindFormProps) {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();

    if (!trimmed) {
      setPhoneError("請輸入手機號碼");
      return;
    }
    if (!PHONE_REGEX.test(trimmed)) {
      setPhoneError("請輸入有效的手機號碼（09 開頭，共 10 碼）");
      return;
    }

    setPhoneError("");
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 手機號碼 */}
      <div className="space-y-2">
        <Label htmlFor="phone">手機號碼</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="numeric"
          placeholder="0912345678"
          maxLength={10}
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (phoneError) setPhoneError("");
          }}
          aria-invalid={!!phoneError || undefined}
          className="h-12 text-base"
        />
        {phoneError && (
          <p className="text-sm text-red-500">{phoneError}</p>
        )}
        <p className="text-xs text-slate-400">
          請輸入預約時使用的手機號碼，以完成帳號綁定
        </p>
      </div>

      {/* API 錯誤 */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 送出 */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full text-base font-medium text-white"
        style={{ backgroundColor: LINE_BRAND_COLOR }}
      >
        {isSubmitting ? "綁定中..." : "綁定帳號"}
      </Button>
    </form>
  );
}
