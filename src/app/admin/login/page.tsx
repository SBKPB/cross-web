"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { useAuth } from "@/lib/auth/auth-context";
import { getAdminHomePath } from "@/lib/auth/roles";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, sessionExpiredMessage, clearSessionExpiredMessage } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      clearSessionExpiredMessage();
    };
  }, [clearSessionExpiredMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userData = await login(email, password);
      router.push(getAdminHomePath(userData));
    } catch {
      setError("帳號或密碼錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout variant="console">
      <div className="relative w-full max-w-md">
        {/* 淡品牌光暈背景 */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-8 -top-12 -z-10 h-48 rounded-full bg-primary/10 blur-3xl"
        />
        <Card className="w-full rounded-3xl bg-card py-8 shadow-sm ring-1 ring-foreground/5">
          <CardHeader className="items-center text-center">
            <Link
              href="/"
              aria-label="返回首頁"
              className="group/logo self-center"
            >
              <span className="inline-flex size-16 items-center justify-center rounded-3xl bg-primary/10 ring-1 ring-primary/15 transition group-hover/logo:scale-105 group-hover/logo:ring-primary/25">
                <Image
                  src="/cross-icon.png"
                  alt="Cross"
                  width={56}
                  height={56}
                  priority
                  className="size-12 rounded-2xl"
                />
              </span>
            </Link>
            <CardTitle className="mt-4 text-2xl font-bold tracking-tight">
              Console 登入
            </CardTitle>
            <CardDescription className="mt-1">
              請輸入管理員帳號密碼
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {sessionExpiredMessage && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-muted p-3.5 text-sm text-muted-foreground ring-1 ring-border">
                  <AlertCircle className="mt-px size-4 shrink-0" />
                  <span>{sessionExpiredMessage}</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-sm font-medium text-destructive ring-1 ring-destructive/20">
                  <AlertCircle className="mt-px size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">電子郵件</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密碼</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-2xl text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    登入中...
                  </>
                ) : (
                  "登入"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                返回首頁
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthSplitLayout>
  );
}
