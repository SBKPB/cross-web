"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessAdmin } from "@/lib/auth/roles";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // 如果在登入頁，不需要檢查
    if (pathname === "/admin/login") return;

    // 如果還在載入中，不做任何事
    if (isLoading) return;

    // 如果未登入，導向登入頁
    if (!isAuthenticated) {
      router.push("/admin/login");
      return;
    }

    // 已登入但角色不能進後台 → 踢回民眾端首頁
    if (!canAccessAdmin(user)) {
      router.push("/");
    }
  }, [user, isAuthenticated, isLoading, pathname, router]);

  // 登入頁不需要檢查
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // 載入中顯示空白
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  // 未登入時不顯示內容（會被 redirect）
  if (!isAuthenticated) {
    return null;
  }

  return <AdminShell>{children}</AdminShell>;
}
