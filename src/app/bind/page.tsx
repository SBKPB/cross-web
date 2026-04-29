"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BindSuccess } from "@/components/line/bind-success";
import { useAuth } from "@/lib/auth/auth-context";
import { lineApi } from "@/lib/api/line";
import { ApiError } from "@/lib/api/client";

type PageState = "idle" | "submitting" | "success" | "error";

function BindContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t") || "";
  const { user, isAuthenticated, isLoading } = useAuth();

  const [state, setState] = useState<PageState>(token ? "idle" : "error");
  const [boundEmail, setBoundEmail] = useState<string>();
  const [error, setError] = useState(
    token ? "" : "缺少綁定 token，請回到 LINE 輸入「綁定」取得連結",
  );

  const handleBind = async () => {
    if (!token) return;

    setState("submitting");
    setError("");

    try {
      const res = await lineApi.bindByToken({ token });
      if (res.success) {
        setBoundEmail(res.user_email ?? user?.email);
        setState("success");
      } else {
        setError(res.message || "綁定失敗，請稍後再試");
        setState("idle");
      }
    } catch (err) {
      let detail = "綁定失敗，請稍後再試";
      if (err instanceof ApiError) {
        const data = err.data as { detail?: string } | null;
        if (data?.detail) detail = data.detail;
      }
      setError(detail);
      setState("idle");
    }
  };

  // 載入中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-green-500" />
      </div>
    );
  }

  // 缺 token
  if (state === "error") {
    return (
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // 綁定成功
  if (state === "success") {
    return (
      <div className="mx-auto max-w-md px-5 py-8">
        <BindSuccess patientName={boundEmail} />
      </div>
    );
  }

  // 未登入：引導登入後再回到此頁
  if (!isAuthenticated) {
    const next = `/bind?t=${encodeURIComponent(token)}`;
    return (
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-slate-800">LINE 帳號綁定</h1>
          <p className="mt-1 text-sm text-slate-500">
            請先登入 Cross 帳號，才能將 LINE 綁定到此帳號
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            綁定後就診前一天會透過 LINE 自動發送提醒，並可在聊天輸入「查詢預約」、「取消預約」等指令。
          </p>
          <Button asChild size="lg" className="mt-5 w-full">
            <Link href={`/auth?next=${encodeURIComponent(next)}`}>
              <LogIn className="size-4" />
              前往登入
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // 已登入：顯示確認按鈕
  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold text-slate-800">LINE 帳號綁定</h1>
        <p className="mt-1 text-sm text-slate-500">綁定後即可接收預約提醒通知</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs text-slate-500">將綁定到</p>
          <p className="text-base font-medium text-slate-800">{user?.email}</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
            {error}
          </div>
        )}

        <Button
          size="lg"
          className="w-full"
          onClick={handleBind}
          disabled={state === "submitting"}
        >
          {state === "submitting" ? "綁定中..." : "確認綁定"}
        </Button>

        <p className="text-center text-xs text-slate-400">
          想換成其他帳號？請先登出後再回到此連結。
        </p>
      </div>
    </div>
  );
}

export default function BindPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-green-500" />
        </div>
      }
    >
      <BindContent />
    </Suspense>
  );
}
