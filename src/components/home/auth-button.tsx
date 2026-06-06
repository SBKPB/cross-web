"use client";

import Link from "next/link";
import { LayoutDashboard, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessAdmin, getAdminHomePath } from "@/lib/auth/roles";

/**
 * 民眾端 header 的登入 / 帳號按鈕
 *
 * - 未登入：顯示「診所登入」→ /admin 與「登入」按鈕 → /auth
 * - 已登入（民眾）：顯示使用者名稱 → /member
 * - 已登入（後台帳號）：顯示「管理後台」→ 後台首頁，不導向民眾端
 *
 * 「診所登入」只在完全未登入時出現；登入後台帳號後一律由下方
 * 「管理後台」接手，避免兩顆按鈕同時指向後台造成重複。
 */
export function AuthButton() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && user) {
    const isAdmin = canAccessAdmin(user);
    return (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="gap-1.5 text-foreground hover:text-primary"
      >
        <Link href={isAdmin ? getAdminHomePath(user) : "/member"}>
          {isAdmin ? (
            <LayoutDashboard className="size-4" />
          ) : (
            <User className="size-4" />
          )}
          <span className="hidden sm:inline">
            {isAdmin ? "管理後台" : user.display_name || user.email.split("@")[0]}
          </span>
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="hidden text-foreground hover:text-primary sm:inline-flex"
      >
        <Link href="/admin">診所登入</Link>
      </Button>
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
    </>
  );
}
