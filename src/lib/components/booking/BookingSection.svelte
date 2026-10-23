<script lang="ts">
	import type { Snippet } from "svelte";
	import { inkOn } from "#lib/color-contrast.ts";
	import { cn } from "#lib/utils.ts";

	/**
	 * 預約流程共用區段卡片：圓角 / 柔色 ring / 序號徽章標題，
	 * 與院所詳情頁 SectionCard 一致的視覺節奏。（移植自舊版 components/booking/booking-section.tsx）
	 */
	let {
		index,
		title,
		description,
		action,
		children,
		class: className,
		primaryColor,
	}: {
		/** 區段序號（如 1、2、3），顯示在標題前的圓形徽章 */
		index?: number;
		title: string;
		description?: string;
		action?: Snippet;
		children: Snippet;
		class?: string;
		/** 主色（用於序號徽章），對齊院所詳情頁設計語言 */
		primaryColor?: string;
	} = $props();
</script>

<section class={cn("rounded-3xl border border-border/80 bg-card p-5 sm:p-7", className)}>
	<div class="mb-6 flex items-start justify-between gap-3">
		<div class="flex items-center gap-2.5">
			{#if index !== undefined}
				<span
					class="flex size-7 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm"
					style:background-color={primaryColor}
					style:color={inkOn(primaryColor)}>{index}</span
				>
			{/if}
			<div>
				<h2 class="text-base font-semibold leading-tight text-foreground">{title}</h2>
				{#if description}
					<p class="mt-0.5 text-xs text-muted-foreground">{description}</p>
				{/if}
			</div>
		</div>
		{@render action?.()}
	</div>
	{@render children()}
</section>
