<script lang="ts">
	import History from "@lucide/svelte/icons/history";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import { untrack } from "svelte";
	import { favoritesApi } from "$lib/api/favorites";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Card } from "$lib/components/ui/card/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import { FACILITY_TYPE_COLORS, FACILITY_TYPE_LABELS } from "$lib/constants/clinic-constants";
	import type { Clinic } from "$lib/types/clinic";
	import { cn } from "$lib/utils";

	/**
	 * 最近瀏覽橫向 rail（民眾端會員頁，移植自舊版 components/member/recently-viewed-rail.tsx）。
	 * - 由後端 GET /member/recently-viewed 取得（最新在前，上限 10）。
	 * - 無資料則整塊隱藏。
	 */
	let { ready }: { ready: boolean } = $props();

	let clinics = $state.raw<Clinic[]>([]);
	let isLoading = $state(true);

	async function fetchRecent() {
		isLoading = true;
		try {
			clinics = await favoritesApi.listRecentlyViewed();
		} catch {
			clinics = [];
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		if (!ready) return;
		untrack(fetchRecent);
	});
</script>

<!-- 載入完成且無資料：不顯示整塊 -->
{#if isLoading || clinics.length > 0}
	<div>
		<h2 class="mb-3 flex items-center gap-1.5 text-base font-semibold text-foreground">
			<History class="size-4 text-muted-foreground" />
			最近瀏覽
		</h2>
		<div
			class="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			{#if isLoading}
				{#each [0, 1, 2] as i (i)}
					<Card class="w-44 shrink-0 p-3" aria-hidden="true">
						<Skeleton class="size-11 rounded-2xl" />
						<Skeleton class="mt-2 h-4 w-3/4" />
						<Skeleton class="mt-2 h-3 w-1/2" />
					</Card>
				{/each}
			{:else}
				{#each clinics as clinic, i (`${clinic.id}-${i}`)}
					<a href="/clinic/{clinic.id}" class="shrink-0">
						<Card class="flex w-44 flex-col gap-2 p-3 transition-shadow hover:shadow-md">
							<!-- Logo / 首字頭像 -->
							{#if clinic.logo}
								<div class="size-11 overflow-hidden rounded-2xl bg-white ring-1 ring-foreground/10">
									<!-- 舊版 next/image unoptimized（原圖、lazy） -->
									<img
										src={clinic.logo}
										alt="{clinic.clinic_name} logo"
										width="44"
										height="44"
										loading="lazy"
										decoding="async"
										class="size-full object-contain"
										style="color:transparent"
									/>
								</div>
							{:else}
								<span
									class="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-sky-500 text-base font-bold text-primary-foreground"
								>
									{clinic.clinic_name.charAt(0)}
								</span>
							{/if}
							<div class="line-clamp-2 text-sm font-medium leading-snug text-foreground">
								{clinic.clinic_name}
							</div>
							{#if clinic.facility_type}
								<Badge class={cn("w-fit border-0 text-[11px]", FACILITY_TYPE_COLORS[clinic.facility_type])}>
									{FACILITY_TYPE_LABELS[clinic.facility_type]}
								</Badge>
							{/if}
							{#if clinic.city}
								<div class="flex items-center gap-1 text-xs text-muted-foreground">
									<MapPin class="size-3 shrink-0" />
									{clinic.city}
								</div>
							{/if}
						</Card>
					</a>
				{/each}
			{/if}
		</div>
	</div>
{/if}
