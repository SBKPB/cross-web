"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { canAccessAdmin } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  clinicId: string;
  /** 觸發點所在路徑，未登入導向登入頁時用作 next */
  nextPath?: string;
  className?: string;
  /** 視覺風格：light 用於深色 banner（白底毛玻璃），default 用於淺色卡片 */
  variant?: "default" | "light";
}

/**
 * 收藏愛心按鈕。
 * - 未登入點擊 → 導向登入頁。
 * - 後台帳號不顯示（民眾端功能）。
 * - 樂觀更新，由 useFavorites 模組級快取共享狀態。
 */
export function FavoriteButton({
  clinicId,
  nextPath,
  className,
  variant = "default",
}: FavoriteButtonProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const isMember = isAuthenticated && !canAccessAdmin(user);
  const { isFavorite, toggleFavorite } = useFavorites(isMember);
  const [busy, setBusy] = useState(false);

  // 後台帳號不顯示收藏功能
  if (isAuthenticated && !isMember) return null;

  const active = isMember && isFavorite(clinicId);

  const handleClick = async (e: React.MouseEvent) => {
    // 卡片本身可點擊，阻止冒泡避免觸發導航
    e.preventDefault();
    e.stopPropagation();

    if (!isMember) {
      const target = nextPath ?? `/clinic/${clinicId}`;
      router.push(`/auth?next=${encodeURIComponent(target)}`);
      return;
    }

    if (busy) return;
    setBusy(true);
    try {
      await toggleFavorite(clinicId);
    } catch {
      // 失敗已由 hook 回滾，這裡靜默
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={active ? "取消收藏" : "加入收藏"}
      aria-pressed={active}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full transition-colors disabled:opacity-60",
        variant === "light"
          ? "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-white/25"
          : "bg-background/80 text-muted-foreground ring-1 ring-border/60 backdrop-blur hover:text-rose-500",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-[18px] transition-all",
          active && "fill-rose-500 text-rose-500",
        )}
      />
    </button>
  );
}
