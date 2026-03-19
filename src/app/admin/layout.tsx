"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { AdminHeader } from "@/components/admin/admin-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // 如果在登入頁，不需要檢查
    if (pathname === "/admin/login") return;

    // 如果還在載入中，不做任何事
    if (isLoading) return;

    // 如果未登入，導向登入頁
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // 登入頁不需要檢查
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // 載入中顯示空白
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  // 未登入時不顯示內容（會被 redirect）
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <AdminHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
