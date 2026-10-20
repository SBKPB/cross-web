<script lang="ts">
	import ArrowLeft from "@lucide/svelte/icons/arrow-left";
	import Compass from "@lucide/svelte/icons/compass";
	import Heart from "@lucide/svelte/icons/heart";
	import { untrack } from "svelte";
	import { goto } from "$app/navigation";
	import { favoritesApi } from "$lib/api/favorites";
	import { requireMember } from "$lib/auth/auth.svelte";
	import ClinicCard from "$lib/components/clinics/ClinicCard.svelte";
	import ClinicListSkeleton from "$lib/components/clinics/ClinicListSkeleton.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Card } from "$lib/components/ui/card/index.js";
	import { useFavorites } from "$lib/hooks/favorites.svelte";
	import type { Clinic } from "$lib/types/clinic";

	// 移植自舊版 app/member/favorites/page.tsx
	// 守衛：未登入導向登入頁，後台帳號導回後台
	const guard = requireMember(() => "/member/favorites");
	const favorites = useFavorites(() => guard.ready);

	let clinics = $state.raw<Clinic[]>([]);
	let isLoading = $state(true);

	async function fetchFavorites() {
		isLoading = true;
		try {
			clinics = await favoritesApi.listFavorites();
		} catch (err) {
			console.error("Failed to load favorites:", err);
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		if (!guard.ready) return;
		untrack(fetchFavorites);
	});

	// clinics 已是後端回傳的收藏清單；模組快取就緒前直接顯示，避免快取載入空窗誤判為空。
	// 就緒後才以收藏狀態過濾，以保留「取消收藏即時從清單移除」的樂觀行為。
	const visibleClinics = $derived(
		favorites.ready ? clinics.filter((c) => favorites.isFavorite(c.id)) : clinics,
	);
</script>

{#if !guard.ready}
	<div class="flex min-h-[60vh] items-center justify-center bg-background">
		<div class="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
	</div>
{:else}
	<div class="min-h-[60vh] bg-background">
		<!-- Header -->
		<div class="border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
			<div class="mx-auto flex max-w-5xl items-center gap-3">
				<a href="/member" class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
					<ArrowLeft class="mr-1 size-4" />
					返回
				</a>
				<h1 class="text-lg font-bold text-foreground">我的收藏</h1>
				{#if !isLoading && visibleClinics.length > 0}
					<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
						{visibleClinics.length}
					</span>
				{/if}
			</div>
		</div>

		<div class="mx-auto max-w-5xl px-4 py-6 sm:px-6">
			{#if isLoading}
				<ClinicListSkeleton count={6} />
			{:else if visibleClinics.length === 0}
				<Card class="flex flex-col items-center gap-3 p-12 text-center">
					<span
						class="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-400 dark:bg-rose-900/20"
					>
						<Heart class="size-7" />
					</span>
					<p class="text-sm text-muted-foreground">還沒有收藏任何診所</p>
					<Button onclick={() => goto("/search")}>
						<Compass class="mr-1.5 size-4" />
						去逛逛診所
					</Button>
				</Card>
			{:else}
				<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{#each visibleClinics as clinic, i (`${clinic.id}-${i}`)}
						<ClinicCard {clinic} onClick={() => goto(`/clinic/${clinic.id}`)} />
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
