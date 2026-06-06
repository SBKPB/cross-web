"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessAdmin, getAdminHomePath } from "@/lib/auth/roles";

/**
 * 民眾端頁面守衛（與 {@link useRequireSystemAdmin} 對稱）：
 * - 未登入 → 導向 /auth?next=<目前頁>
 * - 後台帳號（系統管理員 / 院所使用者）→ 導回其後台首頁，避免後台帳號出現在民眾端
 *
 * @param nextPath 未登入時登入完成後要返回的路徑
 * @returns ready — 是否已確認為「可顯示民眾端內容」的狀態，用來 gate 畫面與資料請求
 */
export function useRequireMember(nextPath: string): { ready: boolean } {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const isAdminAccount = isAuthenticated && canAccessAdmin(user);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    if (canAccessAdmin(user)) {
      router.replace(getAdminHomePath(user));
    }
  }, [user, isLoading, isAuthenticated, nextPath, router]);

  return { ready: !isLoading && isAuthenticated && !isAdminAccount };
}
