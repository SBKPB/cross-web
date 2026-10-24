<script lang="ts">
	import ArrowLeft from "@lucide/svelte/icons/arrow-left";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import Share2 from "@lucide/svelte/icons/share-2";
	import Star from "@lucide/svelte/icons/star";
	import FavoriteButton from "#lib/components/clinics/FavoriteButton.svelte";
	import ShareClinicDialog from "#lib/components/clinics/ShareClinicDialog.svelte";
	import { Badge } from "#lib/components/ui/badge/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import { FACILITY_TYPE_LABELS, HOSPITAL_LEVELS, PAYMENT_TYPES } from "#lib/constants/clinic-constants.ts";
	import type { Clinic } from "#lib/types/clinic.ts";
	import { cn } from "#lib/utils.ts";

	let { clinic, class: className }: { clinic: Clinic; class?: string } = $props();

	let shareOpen = $state(false);
</script>

<!-- 圖示與文字間不留空白（與舊版 JSX 輸出相同） -->
<section class={cn("border-b border-border/60 bg-[#eff4fa] dark:bg-[#142238]", className)}>
	<div class="home-container py-6 sm:py-10">
		<div class="mb-7 flex items-center justify-between gap-3">
			<a href="/search" class="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
				><ArrowLeft class="size-4" />探索服務</a
			>
			<div class="flex items-center gap-2">
				<FavoriteButton clinicId={clinic.id} nextPath={`/clinic/${clinic.id}`} />
				<Button variant="outline" size="icon" onclick={() => (shareOpen = true)} aria-label="分享此頁面"
					><Share2 class="size-4" /></Button
				>
			</div>
		</div>
		{#if clinic.images?.[0]}
			<!-- 舊版 next/image fill + priority 的輸出 -->
			<div class="relative mb-7 h-48 overflow-hidden rounded-3xl sm:h-64">
				<img
					src={clinic.images[0]}
					alt={clinic.clinic_name}
					fetchpriority="high"
					decoding="async"
					class="object-cover"
					style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent"
				/>
			</div>
		{/if}
		<div class="flex flex-col gap-5 sm:flex-row sm:gap-7">
			{#if clinic.logo}
				<img
					src={clinic.logo}
					alt={`${clinic.clinic_name} logo`}
					width="96"
					height="96"
					loading="lazy"
					decoding="async"
					style="color:transparent"
					class="size-20 shrink-0 rounded-3xl border border-border/70 bg-white object-contain sm:size-24"
				/>
			{:else}
				<span
					aria-hidden="true"
					class="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-card text-3xl font-medium text-primary sm:size-24 sm:text-4xl"
					>{clinic.clinic_name.slice(0, 1)}</span
				>
			{/if}
			<div class="min-w-0 flex-1">
				<div class="mb-3 flex flex-wrap gap-2">
					{#if clinic.facility_type}<Badge variant="secondary">{FACILITY_TYPE_LABELS[clinic.facility_type]}</Badge>{/if}
					{#if clinic.payment_type}<Badge variant="outline">{PAYMENT_TYPES[clinic.payment_type]}</Badge>{/if}
					{#if !clinic.facility_type || clinic.facility_type === "healthcare"}<Badge variant="outline"
							>{HOSPITAL_LEVELS[clinic.hospital_level]}</Badge
						>{/if}
				</div>
				<h1 class="text-3xl font-semibold leading-snug tracking-tight sm:text-4xl">{clinic.clinic_name}</h1>
				<div class="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
					{#if clinic.city}<span class="inline-flex items-center gap-1.5"><MapPin class="size-4" />{clinic.city}</span>{/if}
					{#if clinic.rating != null}<span class="inline-flex items-center gap-1.5"
							><Star class="size-4 fill-amber-400 text-amber-400" />{clinic.rating.toFixed(1)}{clinic.review_count
								? `（${clinic.review_count} 則評論）`
								: ""}</span
						>{/if}
				</div>
				{#if clinic.description}<p class="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">{clinic.description}</p>{/if}
			</div>
		</div>
		<nav aria-label="店家內容" class="mt-7 flex flex-wrap gap-2 border-t border-border/70 pt-5 text-sm">
			{#if clinic.services?.length}<a href="#services" class="rounded-full bg-card px-4 py-2.5 hover:text-primary">服務項目</a>{/if}
			{#if clinic.members?.length}<a href="#team" class="rounded-full bg-card px-4 py-2.5 hover:text-primary">專業團隊</a>{/if}
			<a href="#contact" class="rounded-full bg-card px-4 py-2.5 hover:text-primary">聯絡與交通</a>
		</nav>
	</div>
	<ShareClinicDialog clinicId={clinic.id} clinicName={clinic.clinic_name} bind:open={shareOpen} />
</section>
