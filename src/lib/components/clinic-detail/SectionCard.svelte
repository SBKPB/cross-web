<script lang="ts">
	import type { Component, Snippet } from "svelte";
	import { cn } from "$lib/utils";

	/** 詳細頁共用區段卡片：統一的圓角、陰影、圖示標題節奏 */
	let {
		icon: Icon,
		title,
		action,
		children,
		class: className,
	}: {
		icon: Component<{ class?: string }>;
		title: string;
		action?: Snippet;
		children: Snippet;
		class?: string;
	} = $props();
</script>

<section class={cn("rounded-3xl border border-border/80 bg-card p-5 sm:p-7", className)}>
	<div class="mb-6 flex items-center justify-between gap-3">
		<!-- 圖示與標題間不留空白（與舊版 JSX 輸出相同） -->
		<h2 class="flex items-center gap-2.5 text-base font-semibold text-foreground">
			<span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
				><Icon class="size-[18px]" /></span
			>{title}
		</h2>
		{@render action?.()}
	</div>
	{@render children()}
</section>
