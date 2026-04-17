"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth/auth-context";
import { memberPatientApi } from "@/lib/api/member-patient";
import { validateIdentifier } from "@/lib/validation/tw-identifier";
import {
  IDENTIFIER_TYPE_LABELS,
  IDENTIFIER_PLACEHOLDERS,
  IDENTIFIER_ERROR_MESSAGES,
} from "@/lib/constants/patient-constants";
import type { IdentifierType } from "@/types/member-patient";
import { lumaIconBadge } from "@/lib/styles/luma";
import { cn } from "@/lib/utils";

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const nextUrl = searchParams.get("next") || "/member";

  const [name, setName] = useState(user?.display_name || "");
  const [identifierType, setIdentifierType] =
    useState<IdentifierType>("national_id");
  const [identifierValue, setIdentifierValue] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // 如果已經有 member_patients 就跳過
  const checkExistingProfile = useCallback(async () => {
    try {
      const patients = await memberPatientApi.list();
      if (patients.length > 0) {
        router.replace(nextUrl);
        return;
      }
    } catch {
      // 沒有 patients 或 API 錯誤 → 繼續顯示表單
    }
    setIsCheckingProfile(false);
  }, [router, nextUrl]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth?next=${encodeURIComponent(nextUrl)}`);
      return;
    }
    checkExistingProfile();
  }, [authLoading, isAuthenticated, router, nextUrl, checkExistingProfile]);

  // 即時驗證身分證
  const handleIdentifierChange = (value: string) => {
    setIdentifierValue(value);
    if (value.trim().length >= 6) {
      const isValid = validateIdentifier(identifierType, value);
      setIdentifierError(
        isValid ? null : IDENTIFIER_ERROR_MESSAGES[identifierType],
      );
    } else {
      setIdentifierError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateIdentifier(identifierType, identifierValue)) {
      setIdentifierError(IDENTIFIER_ERROR_MESSAGES[identifierType]);
      return;
    }

    setIsSubmitting(true);
    try {
      await memberPatientApi.create({
        name,
        identifier_type: identifierType,
        identifier_value: identifierValue,
        birth_date: birthDate,
        gender,
        phone: phone || undefined,
        relation: "self",
      });
      router.push(nextUrl);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "建立失敗，請稍後再試";
      if (msg.includes("已經是")) {
        setError("此身分識別碼已經綁定過帳號");
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isCheckingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="items-center text-center">
          <div className={cn(lumaIconBadge, "size-14")}>
            <UserPlus className="size-6" />
          </div>
          <CardTitle className="mt-3 text-xl">建立個人資料</CardTitle>
          <CardDescription>
            {user?.email
              ? `${user.email}，請填寫以下資料完成註冊`
              : "首次登入需填寫基本資料以開始使用預約服務"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">
                姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="王小明"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>
                身分識別碼 <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <Select
                  value={identifierType}
                  onValueChange={(v) => {
                    setIdentifierType(v as IdentifierType);
                    setIdentifierError(null);
                  }}
                >
                  <SelectTrigger id="identifier-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national_id">
                      {IDENTIFIER_TYPE_LABELS.national_id}
                    </SelectItem>
                    <SelectItem value="arc">
                      {IDENTIFIER_TYPE_LABELS.arc}
                    </SelectItem>
                    <SelectItem value="passport">
                      {IDENTIFIER_TYPE_LABELS.passport}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="identifier-value"
                  value={identifierValue}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  placeholder={IDENTIFIER_PLACEHOLDERS[identifierType]}
                  required
                />
              </div>
              {identifierError && (
                <p className="text-xs text-destructive">{identifierError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="birth-date">
                  生日 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>
                  性別 <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={gender}
                  onValueChange={setGender}
                  className="flex gap-4 pt-2"
                >
                  <label
                    htmlFor="gender-m"
                    className="flex items-center gap-2"
                  >
                    <RadioGroupItem value="M" id="gender-m" />
                    <span className="text-sm">男</span>
                  </label>
                  <label
                    htmlFor="gender-f"
                    className="flex items-center gap-2"
                  >
                    <RadioGroupItem value="F" id="gender-f" />
                    <span className="text-sm">女</span>
                  </label>
                </RadioGroup>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">電話（選填）</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                maxLength={15}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting ||
                !name.trim() ||
                !identifierValue.trim() ||
                !birthDate ||
                !gender
              }
            >
              {isSubmitting ? "建立中..." : "完成註冊"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      }
    >
      <CompleteProfileContent />
    </Suspense>
  );
}
