"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BindForm } from "@/components/line/bind-form";
import { BindSuccess } from "@/components/line/bind-success";
import { lineApi } from "@/lib/api/line";

type PageState = "idle" | "submitting" | "success" | "error";

function BindContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t") || "";

  const [state, setState] = useState<PageState>(token ? "idle" : "error");
  const [patientName, setPatientName] = useState<string>();
  const [error, setError] = useState(
    token ? "" : "缺少綁定 token，請回到 LINE 輸入「綁定」取得連結"
  );

  const handleSubmit = useCallback(
    async (phone: string) => {
      if (!token) return;

      setState("submitting");
      setError("");

      try {
        const res = await lineApi.bindByToken({
          token,
          patient_phone: phone,
        });

        if (res.success) {
          setPatientName(res.patient_name);
          setState("success");
        } else {
          setError(res.message || "綁定失敗，請稍後再試");
          setState("idle");
        }
      } catch (err: unknown) {
        const detail =
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "data" in err.response &&
          err.response.data &&
          typeof err.response.data === "object" &&
          "detail" in err.response.data
            ? String(err.response.data.detail)
            : "綁定失敗，請確認手機號碼是否正確，或稍後再試";
        setError(detail);
        setState("idle");
      }
    },
    [token]
  );

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      {/* 頁面標題 */}
      {state !== "success" && (
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-slate-800">
            LINE 帳號綁定
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            綁定後即可接收預約提醒通知
          </p>
        </div>
      )}

      {/* 綁定表單 */}
      {(state === "idle" || state === "submitting") && (
        <BindForm
          isSubmitting={state === "submitting"}
          error={error}
          onSubmit={handleSubmit}
        />
      )}

      {/* 綁定成功 */}
      {state === "success" && <BindSuccess patientName={patientName} />}

      {/* 錯誤（無 token） */}
      {state === "error" && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
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
