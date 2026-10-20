<script lang="ts">
	import ArrowRight from "@lucide/svelte/icons/arrow-right";
	import Loader2 from "@lucide/svelte/icons/loader-circle";
	import { inkOn } from "$lib/color-contrast";
	import { cn } from "$lib/utils";

	// 移植自舊版 components/booking/sticky-submit-button.tsx：固定在底部的下一步／送出按鈕
	let {
		label,
		onClick,
		disabled = false,
		isLoading = false,
		primaryColor = "#1d4ed8",
		class: className,
		hint,
	}: {
		label: string;
		onClick: () => void;
		disabled?: boolean;
		isLoading?: boolean;
		primaryColor?: string;
		class?: string;
		/** 按鈕上方的輔助提示（如目前選取摘要） */
		hint?: string;
	} = $props();
</script>

<div
	class={cn(
		"fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3",
		"glass-bar border-t border-border/60",
		className,
	)}
>
	<div class="mx-auto max-w-2xl">
		{#if hint}
			<p class="mb-2 truncate text-center text-xs text-muted-foreground">{hint}</p>
		{/if}
		<button
			type="button"
			onclick={onClick}
			disabled={disabled || isLoading}
			class={cn(
				"group/button inline-flex h-12 w-full items-center justify-center gap-2",
				"rounded-full text-base font-semibold",
				"shadow-sm transition-all",
				"hover:brightness-105 active:translate-y-px",
				"disabled:pointer-events-none disabled:opacity-50",
			)}
			style:background-color={primaryColor}
			style:color={inkOn(primaryColor)}
		>
			{#if isLoading}
				<Loader2 class="size-5 animate-spin" />
				處理中…
			{:else}
				{label}
				<ArrowRight class="size-4 transition-transform group-hover/button:translate-x-0.5" />
			{/if}
		</button>
	</div>
</div>
