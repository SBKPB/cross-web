// 在 $effect.root 內模擬 root layout（resetFavoritesOnUserChange）與多個收藏消費元件（useFavorites）。
// user 以 $state 提供，可整個換成新物件（同 id）以驗證「只看 id」的語意。
// 本檔也會被 pnpm check 型別檢查。
import { flushSync } from "svelte";
import { resetFavoritesOnUserChange, useFavorites } from "../../src/lib/hooks/favorites.svelte.ts";

/**
 * @param {{ user?: { id: string } | null, enabled?: boolean, consumers?: number, watchId?: string }} [options]
 *   watchId：在 $effect 內讀 isFavorite(watchId)，每次重跑把值記到 watched（驗證畫面會跟著更新）
 */
export function mountFavorites({ user = null, enabled = true, consumers = 1, watchId = "" } = {}) {
  /** @type {boolean[]} */
  const watched = [];
  /** @type {{ id: string } | null} */
  let current = $state(user);
  let on = $state(enabled);
  /** @type {ReturnType<typeof useFavorites>[]} */
  const stores = [];
  const destroy = $effect.root(() => {
    resetFavoritesOnUserChange(() => current?.id);
    for (let i = 0; i < consumers; i++) stores.push(useFavorites(() => on));
    if (watchId) {
      const fav = stores[0];
      $effect(() => {
        watched.push(fav.isFavorite(watchId));
      });
    }
  });
  flushSync();
  return {
    stores,
    watched,
    get favorites() {
      return stores[0];
    },
    /** @param {{ id: string } | null} next */
    setUser(next) {
      current = next;
      flushSync();
    },
    /** @param {boolean} next */
    setEnabled(next) {
      on = next;
      flushSync();
    },
    destroy,
  };
}
