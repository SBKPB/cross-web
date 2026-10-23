<script lang="ts">
	import CalendarCheck from "@lucide/svelte/icons/calendar-check";
	import Clock from "@lucide/svelte/icons/clock";
	import ShieldCheck from "@lucide/svelte/icons/shield-check";
	import { Button } from "#lib/components/ui/button/index.js";
	import { cn } from "#lib/utils.ts";

	/** 桌機側欄的預約 CTA 卡片（手機改用底部 sticky bar） */
	let { clinicId, class: className }: { clinicId: string; class?: string } = $props();
</script>

<div class={cn("relative overflow-hidden rounded-3xl bg-[#163b85] p-6 text-white", className)}>
	<h3 class="relative text-lg font-bold">線上預約</h3>
	<p class="relative mt-1 text-sm leading-relaxed text-blue-100">先選服務與時段，確認後再登入預約。</p>

	<!-- 圖示與文字間不留空白（與舊版 JSX 輸出相同） -->
	<Button
		href={`/booking/${clinicId}`}
		size="lg"
		variant="secondary"
		class="relative mt-5 w-full font-semibold"><CalendarCheck class="size-5" />查看可約時段</Button
	>

	<div class="relative mt-4 flex flex-col gap-2 text-xs text-blue-100">
		<span class="flex items-center gap-1.5"><Clock class="size-3.5" />24 小時皆可線上預約</span>
		<span class="flex items-center gap-1.5"><ShieldCheck class="size-3.5" />預約成功即時通知</span>
	</div>
</div>
