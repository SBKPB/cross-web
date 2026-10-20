import { untrack } from "svelte";
import { SvelteSet } from "svelte/reactivity";
import { ApiError } from "../api/client.ts";
import { favoritesApi } from "../api/favorites.ts";

// 收藏狀態（移植自 use-favorites.ts）：模組級單一實例，以單一 Set 快取收藏的 facility id，
// 讓列表卡片、診所詳情、收藏頁共用同一份狀態（樂觀更新即時同步）。
// 只在瀏覽器端載入（useFavorites 的 $effect 不會在 SSR 執行），伺服器上的實例永遠是空集合，不會跨請求外洩。
class Favorites {
	// 舊版每次變動換成新的 Set 再通知訂閱者；這裡用 SvelteSet 原地增刪，讀 has() 的地方自動更新
	#ids = new SvelteSet<string>();
	#loaded = $state(false);
	#loadingPromise: Promise<void> | null = null;

	get ready(): boolean {
		return this.#loaded;
	}

	isFavorite = (id: string): boolean => this.#ids.has(id);

	/** 載入收藏 id 集合（僅載一次；多元件並行只發一次請求） */
	ensureLoaded(): Promise<void> {
		if (this.#loaded) return Promise.resolve();
		if (this.#loadingPromise) return this.#loadingPromise;
		this.#loadingPromise = favoritesApi
			.listFavorites()
			.then((clinics) => {
				this.#replaceIds(clinics.map((c) => c.id));
				this.#loaded = true;
			})
			.catch(() => {
				// 未登入或載入失敗：維持空集合，不阻塞畫面
				this.#loaded = true;
			})
			.finally(() => {
				this.#loadingPromise = null;
			});
		return this.#loadingPromise;
	}

	/** 以整份清單取代目前的收藏 id（對應舊版 favoriteIds = new Set(...)） */
	#replaceIds(ids: string[]): void {
		this.#ids.clear();
		for (const id of ids) this.#ids.add(id);
	}

	/** 重置（使用者身分變動時呼叫，避免殘留他人收藏） */
	reset(): void {
		this.#ids.clear();
		this.#loaded = false;
		this.#loadingPromise = null;
	}

	/** 切換收藏；樂觀更新，失敗自動回滾。回傳切換後是否為收藏 */
	toggleFavorite = async (id: string): Promise<boolean> => {
		const wasFavorite = this.#ids.has(id);
		// 樂觀更新
		if (wasFavorite) this.#ids.delete(id);
		else this.#ids.add(id);

		try {
			if (wasFavorite) await favoritesApi.removeFavorite(id);
			else await favoritesApi.addFavorite(id);
			return !wasFavorite;
		} catch (err) {
			// 401 由 client 統一處理（觸發過期流程）；其餘失敗回滾
			if (wasFavorite) this.#ids.add(id);
			else this.#ids.delete(id);
			if (err instanceof ApiError && err.status === 401) return wasFavorite;
			throw err;
		}
	};
}

export type { Favorites };

const favorites = new Favorites();

/** 重置收藏快取（避免殘留他人收藏） */
export function resetFavoritesCache(): void {
	favorites.reset();
}

/**
 * 收藏狀態（舊版 useFavorites hook）。需在元件初始化時呼叫。
 * @param enabled 回傳是否啟用的 getter（通常是「是否為登入的民眾」；未啟用時不發載入請求）。
 *   只有它的值改變時才會重跑（對應舊版 useEffect 的 [enabled] 依賴）。
 * @returns 全站共用的收藏實例（isFavorite／toggleFavorite／ready）
 */
export function useFavorites(enabled: () => boolean = () => true): Favorites {
	$effect(() => {
		if (enabled()) untrack(() => void favorites.ensureLoaded());
	});
	return favorites;
}

/**
 * root layout 呼叫一次：使用者身分（登入／登出／換帳號）變動即重置收藏快取，
 * 避免上一位使用者的收藏狀態殘留到下一位（跨帳號資料外洩）。
 * 對應舊版 AuthProvider 的 `useEffect(() => resetFavoritesCache(), [user?.id])`：
 * 只看 id 的值，同一位使用者換成新物件（例如 refreshUser）不會重置。
 */
export function resetFavoritesOnUserChange(userId: () => string | undefined): void {
	const id = $derived(userId());
	$effect(() => {
		void id;
		untrack(resetFavoritesCache);
	});
}
