<script lang="ts">
	import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";
	import Crown from "@lucide/svelte/icons/crown";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import Phone from "@lucide/svelte/icons/phone";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { categoryLabel, type ServiceTaxonomy } from "$lib/api/service-categories";
	import type { LandingClinic } from "$lib/seo/landing-data";

	/**
	 * 在地落地頁的診所清單（伺服器渲染、純連結卡）。
	 * 用 <a> 直連 /clinic/{id}，確保爬蟲能爬到每個診所頁（內部連結權重傳遞）。
	 */
	let { clinics, taxonomy }: { clinics: LandingClinic[]; taxonomy: ServiceTaxonomy } = $props();
</script>

<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
	<!-- 後端資料可能有重複 id / code：清單一律以索引為 key（同舊版 React 只警告、照樣渲染） -->
	{#each clinics as clinic, i (i)}
		<li>
			<a
				href={`/clinic/${clinic.id}`}
				class="group flex h-full flex-col gap-4 rounded-3xl border border-border/80 bg-card p-6 transition-colors hover:border-primary/40"
			>
				<span
					aria-hidden="true"
					class="flex size-14 items-center justify-center rounded-2xl bg-accent/60 text-2xl text-primary"
					>{clinic.name.slice(0, 1)}</span
				>
				<div class="flex items-center gap-1.5">
					{#if clinic.is_featured}
						<!-- 圖示與文字間不留空白（與舊版 JSX 輸出相同） -->
						<Badge class="gap-1 border-0 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950"
							><Crown class="size-3.5" />精選</Badge
						>
					{/if}
					<h2 class="line-clamp-1 text-base font-semibold text-foreground group-hover:text-primary">
						{clinic.name}
					</h2>
				</div>

				{#if clinic.departments.length > 0}
					<div class="flex flex-wrap gap-1.5">
						{#each clinic.departments.slice(0, 3) as code, j (j)}
							<Badge variant="outline" class="text-muted-foreground">
								{categoryLabel(taxonomy, code)}
							</Badge>
						{/each}
					</div>
				{/if}

				<div class="mt-auto space-y-1.5 text-sm text-muted-foreground">
					{#if clinic.address}
						<div class="flex items-start gap-2">
							<MapPin class="mt-0.5 size-4 shrink-0" />
							<span class="line-clamp-2">{clinic.address}</span>
						</div>
					{/if}
					{#if clinic.phone}
						<div class="flex items-center gap-2">
							<Phone class="size-4 shrink-0" />
							<span>{clinic.phone}</span>
						</div>
					{/if}
				</div>
				<!-- 舊版 JSX「認識店家 <ArrowUpRight />」文字後有一個空白 -->
				<span
					class="mt-2 inline-flex items-center justify-between border-t border-border pt-4 text-sm font-medium text-primary"
					>認識店家 <ArrowUpRight class="size-4" /></span
				>
			</a>
		</li>
	{/each}
</ul>
