"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessAdmin } from "@/lib/auth/roles";
import { favoritesApi } from "@/lib/api/favorites";

/**
 * 進入診所詳情時記錄一次瀏覽（跨裝置同步）。
 * - 僅登入中的民眾端會員記錄；未登入 / 後台帳號略過。
 * - 純副作用元件，不渲染任何畫面。
 */
export function RecordView({ clinicId }: { clinicId: string }) {
  const { isLoading, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || canAccessAdmin(user)) return;
    void favoritesApi.recordRecentlyViewed(clinicId).catch(() => {
      // 記錄瀏覽失敗不影響瀏覽體驗，靜默處理
    });
  }, [clinicId, isLoading, isAuthenticated, user]);

  return null;
}
