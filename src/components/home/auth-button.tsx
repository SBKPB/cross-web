"use client";

import Link from "next/link";
import { LayoutDashboard, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessAdmin, getAdminHomePath } from "@/lib/auth/roles";

/**
 * 民眾端 header 的登入 / 帳號按鈕
 *
 * - 未登入：只顯示民眾「登入」→ /auth
 * - 已登入（民眾）：顯示使用者名稱 → /member
 * - 已登入（後台帳號）：顯示「管理後台」→ 後台首頁，不導向民眾端
 *
 * 未登入時不放「診所登入」：這是民眾端 header，四個項目在民眾／院所兩種身分之間
 * 交錯只會讓民眾困惑。院所入口統一走「夥伴加入」與 footer 的「醫療院所」區
 * （那裡已有診所登入），登入後台帳號後再由「管理後台」接手。
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
    <Button asChild size="sm" className="gap-1.5">
      <Link href="/auth">
        <LogIn className="size-4" />
        登入
      </Link>
    </Button>
  );
}
