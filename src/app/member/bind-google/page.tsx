"use client";

import { useSearchParams } from "next/navigation";
import { useState, useCallback, Suspense } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { CheckCircle, ShieldCheck, CalendarClock, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { memberApi } from "@/lib/api/member";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const BENEFITS = [
  { icon: CalendarClock, title: "快速預約", desc: "自動帶入個人資料" },
  { icon: RotateCcw, title: "紀錄查詢", desc: "隨時查看預約紀錄" },
  { icon: ShieldCheck, title: "專屬提醒", desc: "預約異動即時通知" },
] as const;

type Step = "google" | "phone" | "success";

function BindGoogleContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const bindToken = searchParams.get("bind_token") ?? "";
  const clinicId = searchParams.get("clinic") ?? "";

  const [step, setStep] = useState<Step>("google");
  const [idToken, setIdToken] = useState("");
  const [phoneInput, setPhoneInput] = useState(phone);
  const [phoneError, setPhoneError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitGoogleAuth = useCallback(
    async (token: string, userPhone?: string) => {
      setIsSubmitting(true);
      setError("");
      try {
        const res = await memberApi.googleAuth({
          id_token: token,
          phone: userPhone || undefined,
          bind_token: bindToken || undefined,
        });
        // 儲存 token
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);
        setStep("success");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "綁定失敗，請稍後再試";

        // 首次登入需要手機號碼
        if (message.includes("手機號碼") || message.includes("422")) {
          setIdToken(token);
          setStep("phone");
        } else {
          setError(message);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [bindToken]
  );

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    if (!/^09\d{8}$/.test(phoneInput)) {
      setPhoneError("請輸入有效的手機號碼（09 開頭，共 10 碼）");
      return;
    }

    await submitGoogleAuth(idToken, phoneInput);
  };

  // ── 綁定成功 ──
  if (step === "success") {
    return (
      <div className="flex flex-col items-center px-4 py-12">
        <div className="flex size-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircle className="size-12 text-green-500" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">綁定成功</h1>
        <p className="mt-2 text-sm text-slate-500">
          您的 Google 帳號已成功綁定，下次預約將自動帶入資料
        </p>

        {clinicId && (
          <Button asChild className="mt-6 h-12 w-full max-w-xs text-base">
            <a href={`/clinic/${clinicId}`}>返回診所首頁</a>
          </Button>
        )}
      </div>
    );
  }

  // ── 輸入手機號碼（首次 Google 登入） ──
  if (step === "phone") {
    return (
      <div className="px-4 py-8">
        <h1 className="text-center text-xl font-bold text-slate-900">
          完成會員資料
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          首次使用 Google 登入，請輸入手機號碼以綁定預約紀錄
        </p>

        <Card className="mx-auto mt-6 max-w-sm">
          <CardContent className="p-5">
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">手機號碼</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0912345678"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  maxLength={10}
                />
                {phoneError && (
                  <p className="text-sm text-red-500">{phoneError}</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                type="submit"
                className="h-12 w-full text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? "綁定中..." : "確認綁定"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Google 登入按鈕 ──
  return (
    <div className="px-4 py-8">
      <h1 className="text-center text-xl font-bold text-slate-900">
        綁定 Google 帳號
      </h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        綁定後可快速登入、查看預約紀錄
      </p>

      {/* 好處說明 */}
      <div className="mx-auto mt-6 flex max-w-sm items-start justify-between gap-2">
        {BENEFITS.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.title} className="flex flex-1 flex-col items-center text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon className="size-5" />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">{b.title}</p>
              <p className="mt-0.5 text-xs text-slate-400">{b.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Google 登入 */}
      <Card className="mx-auto mt-6 max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          {GOOGLE_CLIENT_ID ? (
            <GoogleLogin
              onSuccess={(res) => {
                if (res.credential) {
                  submitGoogleAuth(res.credential);
                }
              }}
              onError={() => setError("Google 登入失敗，請重試")}
              text="continue_with"
              shape="rectangular"
              width="300"
            />
          ) : (
            <p className="text-sm text-slate-400">Google 登入尚未設定</p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {isSubmitting && (
            <p className="text-sm text-slate-500">綁定中...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BindGooglePage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-slate-50">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
            </div>
          }
        >
          <BindGoogleContent />
        </Suspense>
      </div>
    </GoogleOAuthProvider>
  );
}
