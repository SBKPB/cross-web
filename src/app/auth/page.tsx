"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import {
  GoogleSignInButton,
  AppleSignInButton,
} from "@/components/auth/social-login-buttons";
import { lumaIconBadge } from "@/lib/styles/luma";
import { cn } from "@/lib/utils";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextUrl = searchParams.get("next") || "/member";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextUrl);
    }
  }, [isAuthenticated, isLoading, router, nextUrl]);

  const handleGoogleSuccess = async (idToken: string) => {
    setError("");
    setIsSubmitting(true);
    try {
      await loginWithGoogle(idToken);
      router.push(nextUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className={cn(lumaIconBadge, "size-14")}>
            <Building2 className="size-6" />
          </div>
          <CardTitle className="mt-3 text-2xl">登入 Cross</CardTitle>
          <CardDescription>
            登入後即可預約看診、管理看診對象與查看預約紀錄
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
              {error}
            </div>
          )}

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google 登入失敗，請重試")}
            disabled={isSubmitting}
          />

          <AppleSignInButton
            onClick={() =>
              setError("Apple 登入尚未設定，請使用 Google 登入")
            }
            disabled={isSubmitting}
          />

          {isSubmitting && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
              登入中...
            </div>
          )}

          <p className="pt-2 text-center text-xs text-muted-foreground">
            登入即表示同意{" "}
            <a
              href="/terms"
              className="underline underline-offset-2 hover:text-foreground"
            >
              服務條款
            </a>{" "}
            與{" "}
            <a
              href="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              隱私政策
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
