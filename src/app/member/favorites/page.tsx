"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Compass, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClinicCard } from "@/components/clinics/clinic-card";
import { ClinicListSkeleton } from "@/components/clinics/clinic-list";
import { useRequireMember } from "@/lib/auth/use-require-member";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { favoritesApi } from "@/lib/api/favorites";
import type { Clinic } from "@/types/clinic";

export default function MemberFavoritesPage() {
  const router = useRouter();
  // 守衛：未登入導向登入頁，後台帳號導回後台
  const { ready } = useRequireMember("/member/favorites");
  const { isFavorite, ready: favoritesReady } = useFavorites(ready);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await favoritesApi.listFavorites();
      setClinics(data);
    } catch (err) {
      console.error("Failed to load favorites:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    fetchFavorites();
  }, [ready, fetchFavorites]);

  // clinics 已是後端回傳的收藏清單；模組快取就緒前直接顯示，避免快取載入空窗誤判為空。
  // 就緒後才以收藏狀態過濾，以保留「取消收藏即時從清單移除」的樂觀行為。
  const visibleClinics = useMemo(
    () => (favoritesReady ? clinics.filter((c) => isFavorite(c.id)) : clinics),
    [clinics, isFavorite, favoritesReady],
  );

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link
            href="/member"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 size-4" />
            返回
          </Link>
          <h1 className="text-lg font-bold text-foreground">我的收藏</h1>
          {!isLoading && visibleClinics.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {visibleClinics.length}
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {isLoading ? (
          <ClinicListSkeleton count={6} />
        ) : visibleClinics.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-400 dark:bg-rose-900/20">
              <Heart className="size-7" />
            </span>
            <p className="text-sm text-muted-foreground">
              還沒有收藏任何診所
            </p>
            <Button onClick={() => router.push("/search")}>
              <Compass className="mr-1.5 size-4" />
              去逛逛診所
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleClinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                onClick={() => router.push(`/clinic/${clinic.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
