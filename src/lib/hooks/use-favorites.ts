"use client";

import { useCallback, useEffect, useState } from "react";
import { favoritesApi } from "@/lib/api/favorites";
import { ApiError } from "@/lib/api/client";

// 模組級收藏狀態：以單一 Set 快取收藏的 facility id，
// 讓列表卡片、診所詳情、收藏頁共用同一份狀態（樂觀更新即時同步）。
let favoriteIds = new Set<string>();
let loaded = false;
let loadingPromise: Promise<void> | null = null;

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function setIds(next: Set<string>) {
  favoriteIds = next;
  emit();
}

/** 載入收藏 id 集合（僅載一次；多元件並行只發一次請求） */
function ensureLoaded(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = favoritesApi
    .listFavorites()
    .then((clinics) => {
      favoriteIds = new Set(clinics.map((c) => c.id));
      loaded = true;
    })
    .catch(() => {
      // 未登入或載入失敗：維持空集合，不阻塞畫面
      loaded = true;
    })
    .finally(() => {
      loadingPromise = null;
      emit();
    });
  return loadingPromise;
}

/** 重置（登出時可呼叫，避免殘留他人收藏） */
export function resetFavoritesCache() {
  favoriteIds = new Set();
  loaded = false;
  loadingPromise = null;
  emit();
}

interface UseFavoritesResult {
  isFavorite: (id: string) => boolean;
  /** 切換收藏；樂觀更新，失敗自動回滾。回傳切換後是否為收藏 */
  toggleFavorite: (id: string) => Promise<boolean>;
  ready: boolean;
}

/**
 * 收藏狀態 hook。
 * @param enabled 是否啟用（通常傳入登入態；未登入時不發載入請求）
 */
export function useFavorites(enabled = true): UseFavoritesResult {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    listeners.add(listener);
    if (enabled) void ensureLoaded();
    return () => {
      listeners.delete(listener);
    };
  }, [enabled]);

  const isFavorite = useCallback((id: string) => favoriteIds.has(id), []);

  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    const wasFavorite = favoriteIds.has(id);
    // 樂觀更新
    const next = new Set(favoriteIds);
    if (wasFavorite) next.delete(id);
    else next.add(id);
    setIds(next);

    try {
      if (wasFavorite) await favoritesApi.removeFavorite(id);
      else await favoritesApi.addFavorite(id);
      return !wasFavorite;
    } catch (err) {
      // 401 由 client 統一處理（觸發過期流程）；其餘失敗回滾
      const rollback = new Set(favoriteIds);
      if (wasFavorite) rollback.add(id);
      else rollback.delete(id);
      setIds(rollback);
      if (err instanceof ApiError && err.status === 401) return wasFavorite;
      throw err;
    }
  }, []);

  return { isFavorite, toggleFavorite, ready: loaded };
}
