<script lang="ts">
	import Calendar from "@lucide/svelte/icons/calendar";
	import { Button } from "$lib/components/ui/button/index.js";
	import { appleCalendarData, googleCalendarUrl, isAppleDevice } from "$lib/booking/calendar";
	import type { BookingResponse } from "$lib/types/booking";

	// 移植自舊版 components/booking/calendar-buttons.tsx（連結與 ICS 內容見 $lib/booking/calendar）
	let { booking, primaryColor = "#1d4ed8" }: { booking: BookingResponse; primaryColor?: string } = $props();

	// Apple 日曆按鈕只在 Apple 裝置顯示。成功頁 ssr = false、預約資料載入後才渲染本元件，
	// 舊版此時 useSyncExternalStore 直接取 client 值，故初始化時判斷一次即可。
	const showApple = isAppleDevice();

	const googleUrl = $derived(googleCalendarUrl(booking));

	const handleAppleCalendar = () => {
		// Apple 裝置：用 data: URL 直接導航，Safari 會跳「加入行事曆」prompt
		// 不用 a.download，避免被當成檔案存到 Files。
		const dataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(appleCalendarData(booking))}`;
		window.location.href = dataUrl;
	};
</script>

<div class="space-y-3 px-4">
	<p class="text-center text-sm text-muted-foreground">加入行事曆</p>

	<div class="flex gap-3">
		<Button variant="outline" size="lg" class="flex-1" href={googleUrl} target="_blank" rel="noopener noreferrer">
			<Calendar class="size-5" style="color: {primaryColor}" />
			Google 日曆
		</Button>

		{#if showApple}
			<Button variant="outline" size="lg" class="flex-1" onclick={handleAppleCalendar}>
				<Calendar class="size-5" style="color: {primaryColor}" />
				Apple 日曆
			</Button>
		{/if}
	</div>
</div>
