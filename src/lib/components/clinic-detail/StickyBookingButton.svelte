<script lang="ts">
	import Calendar from "@lucide/svelte/icons/calendar";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils";

	/** 手機底部 sticky 預約 bar（僅開通線上預約的院所顯示） */
	let { clinicId, class: className }: { clinicId: string; class?: string } = $props();
</script>

<div
	class={cn(
		"fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3",
		"bg-background/80 backdrop-blur-lg",
		"border-t border-border/60",
		"lg:hidden",
		className,
	)}
>
	<!-- 圖示與文字間不留空白（與舊版 JSX 輸出相同） -->
	<Button href={`/booking/${clinicId}`} size="lg" class="w-full shadow-lg"
		><Calendar class="size-5" />查看可約時段</Button
	>
</div>
