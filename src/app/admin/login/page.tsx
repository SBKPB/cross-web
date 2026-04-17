"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Loader2, AlertCircle } from "lucide-react";

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
import { useAuth } from "@/lib/auth/auth-context";
import { getAdminHomePath } from "@/lib/auth/roles";
import { lumaIconBadge } from "@/lib/styles/luma";
import { cn } from "@/lib/utils";

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Link
            href="/"
            aria-label="返回首頁"
            className={cn(lumaIconBadge, "size-14 self-center")}
          >
            <Building2 className="size-6" />
          </Link>
          <CardTitle className="mt-3 text-2xl">Console 登入</CardTitle>
          <CardDescription>請輸入管理員帳號密碼</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {sessionExpiredMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground ring-1 ring-border">
                <AlertCircle className="size-4 shrink-0" />
                <span>{sessionExpiredMessage}</span>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
                {error}
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

            <Button type="submit" className="w-full" disabled={isLoading}>
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

          <div className="mt-4 text-center">
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
  );
}
