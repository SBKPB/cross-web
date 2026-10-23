<script lang="ts">
	import { favoritesApi } from "#lib/api/favorites.ts";
	import { getAuth } from "#lib/auth/auth.svelte.ts";
	import { canAccessAdmin } from "#lib/auth/roles.ts";

	/**
	 * 進入診所詳情時記錄一次瀏覽（跨裝置同步）。
	 * - 僅登入中的民眾端會員記錄；未登入 / 後台帳號略過。
	 * - 純副作用元件，不渲染任何畫面。
	 */
	let { clinicId }: { clinicId: string } = $props();

	const auth = getAuth();

	// 同舊版 useEffect 的相依：clinicId、isLoading、isAuthenticated、user
	$effect(() => {
		const id = clinicId;
		const { isLoading, isAuthenticated, user } = auth;
		if (isLoading) return;
		if (!isAuthenticated || canAccessAdmin(user)) return;
		void favoritesApi.recordRecentlyViewed(id).catch(() => {
			// 記錄瀏覽失敗不影響瀏覽體驗，靜默處理
		});
	});
</script>
