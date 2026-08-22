"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_PASSWORD = 8;

/**
 * 申請人點驗證信後設定後台密碼。
 *
 * 這一步同時完成兩件事：證明信箱是本人的、以及設定密碼——所以密碼
 * 從頭到尾不會出現在 email 裡。設定完成後仍需人工審核才會開通後台。
 */
export function VerifyForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <Card className="w-full max-w-md p-8 text-center">
        <p className="text-sm text-muted-foreground">
          這個連結不完整，請從信件中的連結重新開啟。
        </p>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-md space-y-4 p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-6" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">信箱驗證完成</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          密碼已設定。我們會盡快審核您的申請，
          <strong className="font-medium text-foreground">審核通過後才會開通後台</strong>
          ，屆時會以這個信箱通知您。
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/">回首頁</Link>
        </Button>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError(`密碼至少 ${MIN_PASSWORD} 碼`);
      return;
    }
    if (password !== confirm) {
      setError("兩次輸入的密碼不一致");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/facility-applications/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setDone(true);
        return;
      }
      const detail = (await res.json().catch(() => null)) as
        | { detail?: string }
        | null;
      setError(detail?.detail ?? "驗證失敗，請重新送出申請");
    } catch {
      setError("連線失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md space-y-5 p-8">
      <div className="space-y-1.5">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="size-5" />
        </div>
        <h1 className="pt-2 text-lg font-semibold text-foreground">
          設定後台密碼
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          設定完成即完成信箱驗證。通過審核後，就用這組密碼登入院所後台。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="password">密碼</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`至少 ${MIN_PASSWORD} 碼`}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm">再次輸入密碼</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "設定中…" : "設定密碼並完成驗證"}
        </Button>
      </form>
    </Card>
  );
}
