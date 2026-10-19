<script lang="ts">
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import type { Snippet } from "svelte";

	let {
		eyebrow,
		title,
		description,
		children,
		compact = false,
	}: {
		eyebrow: string;
		title: string;
		description?: string;
		children?: Snippet;
		compact?: boolean;
	} = $props();
</script>

<section class="border-b border-border/60 bg-[#eff4fa] dark:bg-[#142238]">
	<div class="home-container {compact ? 'py-6 sm:py-8' : 'py-10 sm:py-16'}">
		<nav aria-label="麵包屑" class="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
			<a href="/" class="hover:text-primary">首頁</a>
			<ChevronRight class="size-3" />
			<span aria-current="page">{title}</span>
		</nav>
		<p class="home-eyebrow">{eyebrow}</p>
		<h1
			class="mt-3 font-semibold leading-snug tracking-tight {compact
				? 'text-2xl sm:text-3xl'
				: 'text-3xl sm:text-5xl'}"
		>
			{title}
		</h1>
		{#if description}<p class="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
				{description}
			</p>{/if}
		{@render children?.()}
	</div>
</section>
