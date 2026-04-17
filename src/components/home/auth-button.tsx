"use client";

import Link from "next/link";
import { LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * 民眾端 header 的登入 / 帳號按鈕
 *
 * - 未登入：顯示「登入」按鈕 → /auth
 * - 已登入：顯示使用者名稱 → /member
 */
export function AuthButton() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && user) {
    return (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="gap-1.5 text-foreground hover:text-primary"
      >
        <Link href="/member">
          <User className="size-4" />
          <span className="hidden sm:inline">
            {user.display_name || user.email.split("@")[0]}
          </span>
        </Link>
      </Button>
    );
  }

  return (
    <Button
      asChild
      size="sm"
      className="gap-1.5"
    >
      <Link href="/auth">
        <LogIn className="size-4" />
        登入
      </Link>
    </Button>
  );
}
