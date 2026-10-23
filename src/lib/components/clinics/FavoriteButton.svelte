<script lang="ts">
	import Heart from "@lucide/svelte/icons/heart";
	import { goto } from "$app/navigation";
	import { getAuth } from "#lib/auth/auth.svelte.ts";
	import { canAccessAdmin } from "#lib/auth/roles.ts";
	import { useFavorites } from "#lib/hooks/favorites.svelte.ts";
	import { cn } from "#lib/utils.ts";

	/**
	 * 收藏愛心按鈕。
	 * - 未登入點擊 → 導向登入頁。
	 * - 後台帳號不顯示（民眾端功能）。
	 * - 樂觀更新，由 useFavorites 模組級快取共享狀態。
	 */
	let {
		clinicId,
		nextPath,
		class: className,
		variant = "default",
	}: {
		clinicId: string;
		/** 觸發點所在路徑，未登入導向登入頁時用作 next */
		nextPath?: string;
		class?: string;
		/** 視覺風格：light 用於深色 banner（白底毛玻璃），default 用於淺色卡片 */
		variant?: "default" | "light";
	} = $props();

	const auth = getAuth();
	const isMember = $derived(auth.isAuthenticated && !canAccessAdmin(auth.user));
	const favorites = useFavorites(() => isMember);
	let busy = $state(false);

	const active = $derived(isMember && favorites.isFavorite(clinicId));

	async function handleClick(e: MouseEvent) {
		// 卡片本身可點擊，阻止冒泡避免觸發導航
		e.preventDefault();
		e.stopPropagation();

		if (!isMember) {
			const target = nextPath ?? `/clinic/${clinicId}`;
			goto(`/auth?next=${encodeURIComponent(target)}`);
			return;
		}

		if (busy) return;
		busy = true;
		try {
			await favorites.toggleFavorite(clinicId);
		} catch {
			// 失敗已由 hook 回滾，這裡靜默
		} finally {
			busy = false;
		}
	}
</script>

<!-- 後台帳號不顯示收藏功能 -->
{#if !(auth.isAuthenticated && !isMember)}
	<button
		type="button"
		onclick={handleClick}
		disabled={busy}
		aria-label={active ? "取消收藏" : "加入收藏"}
		aria-pressed={active}
		class={cn(
			"inline-flex size-9 items-center justify-center rounded-full transition-colors disabled:opacity-60",
			variant === "light"
				? "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-white/25"
				: "bg-background/80 text-muted-foreground ring-1 ring-border/60 backdrop-blur hover:text-rose-500",
			className,
		)}
	>
		<Heart class={cn("size-[18px] transition-all", active && "fill-rose-500 text-rose-500")} />
	</button>
{/if}
