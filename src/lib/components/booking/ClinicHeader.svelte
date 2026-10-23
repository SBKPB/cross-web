<script lang="ts">
	import ArrowLeft from "@lucide/svelte/icons/arrow-left";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import Phone from "@lucide/svelte/icons/phone";
	import { cn } from "#lib/utils.ts";
	import type { ClinicConfig } from "#lib/types/booking.ts";

	// 移植自舊版 components/booking/clinic-header.tsx（標記逐一對照，元素間不留空白文字節點，同舊版 JSX 輸出）
	let { clinic, class: className }: { clinic: ClinicConfig; class?: string } = $props();
</script>

<div class={cn("border-b border-border/60 bg-[#eff4fa] dark:bg-[#142238]", className)}>
	<div class="mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-8">
		<a
			href={`/clinic/${clinic.id}`}
			class="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
			><ArrowLeft class="size-4" />返回店家介紹</a
		>
		{#if clinic.hero_banner}
			<!-- 舊版 next/image fill + priority 的輸出 -->
			<div class="relative mt-4 h-32 overflow-hidden rounded-3xl sm:h-40">
				<img
					src={clinic.hero_banner}
					alt={clinic.clinic_name}
					fetchpriority="high"
					decoding="async"
					class="object-cover"
					style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent"
				/>
			</div>
		{/if}
		<div class="mt-4 flex items-start gap-4">
			{#if clinic.logo}
				<!-- 舊版 next/image unoptimized（原圖、lazy） -->
				<img
					src={clinic.logo}
					alt=""
					width="64"
					height="64"
					loading="lazy"
					decoding="async"
					style="color:transparent"
					class="size-14 shrink-0 rounded-2xl bg-white object-contain sm:size-16"
				/>
			{:else}
				<span
					aria-hidden="true"
					class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-card text-2xl text-primary sm:size-16"
					>{clinic.clinic_name.slice(0, 1)}</span
				>
			{/if}
			<div class="min-w-0">
				<p class="home-eyebrow">BOOK A VISIT / 安排你的時間</p>
				<h1 class="mt-2 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{clinic.clinic_name}</h1>
				{#if clinic.address}
					<a
						href={clinic.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`}
						target="_blank"
						rel="noopener noreferrer"
						class="mt-2 flex items-start gap-1.5 text-xs leading-6 text-muted-foreground hover:text-primary"
						><MapPin class="mt-1 size-3.5 shrink-0" />{clinic.address}</a
					>
				{/if}
				{#if clinic.phone}
					<a
						href={`tel:${clinic.phone}`}
						class="mt-1 inline-flex min-h-8 items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
						><Phone class="size-3.5" />{clinic.phone}</a
					>
				{/if}
			</div>
		</div>
	</div>
</div>
