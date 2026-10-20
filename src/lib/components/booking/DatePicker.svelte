<script lang="ts">
	import CalendarX2 from "@lucide/svelte/icons/calendar-x-2";
	import ChevronLeft from "@lucide/svelte/icons/chevron-left";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import { groupDatesByMonth } from "$lib/booking/booking-flow";
	import { inkOn } from "$lib/color-contrast";
	import type { BookableDate } from "$lib/types/booking";
	import { cn } from "$lib/utils";

	// 移植自舊版 components/booking/date-picker.tsx（自製月份切換 + 7 欄日期格，不是 react-day-picker）。
	// 換服務／人員時由 BookingFlow 以 {#key} 重掛載，月份回到第一個（舊版 key={service-doctor}）。
	let {
		dates,
		selectedDate,
		onSelectDate,
		primaryColor = "#1d4ed8",
	}: {
		dates: BookableDate[];
		selectedDate: string | null;
		onSelectDate: (date: string) => void;
		primaryColor?: string;
	} = $props();

	const hasAvailableDates = $derived(dates.some((d) => d.isAvailable));

	// 按月份分組
	const dateGroups = $derived(groupDatesByMonth(dates));

	let currentMonthIndex = $state(0);

	const currentGroup = $derived(dateGroups[currentMonthIndex]);
	const hasPrev = $derived(currentMonthIndex > 0);
	const hasNext = $derived(currentMonthIndex < dateGroups.length - 1);
</script>

{#if dates.length === 0 || !hasAvailableDates}
	<div class="flex flex-col items-center gap-2 rounded-2xl bg-muted/40 py-10 text-center">
		<CalendarX2 class="size-6 text-muted-foreground/60" />
		<p class="text-sm text-muted-foreground">暫無可預約日期</p>
	</div>
{:else}
	<div class="space-y-4">
		<!-- 月份切換 -->
		<div class="flex items-center justify-between">
			<button
				type="button"
				aria-label="上個月"
				onclick={() => (currentMonthIndex -= 1)}
				disabled={!hasPrev}
				class={cn(
					"flex size-9 items-center justify-center rounded-full transition-colors",
					hasPrev ? "text-foreground hover:bg-muted" : "cursor-not-allowed text-muted-foreground opacity-30",
				)}
			>
				<ChevronLeft class="size-5" />
			</button>
			<span class="text-base font-semibold text-foreground">{currentGroup?.label}</span>
			<button
				type="button"
				aria-label="下個月"
				onclick={() => (currentMonthIndex += 1)}
				disabled={!hasNext}
				class={cn(
					"flex size-9 items-center justify-center rounded-full transition-colors",
					hasNext ? "text-foreground hover:bg-muted" : "cursor-not-allowed text-muted-foreground opacity-30",
				)}
			>
				<ChevronRight class="size-5" />
			</button>
		</div>

		<!-- 日期網格 — 橫向 7 欄，每格顯示 週X / DD（日期來自後端，不以日期當 key，重複時 keyed each 會丟錯） -->
		<div class="grid grid-cols-7 gap-1.5">
			{#each currentGroup?.dates ?? [] as dateInfo, i (i)}
				{@const isSelected = selectedDate === dateInfo.date}
				{@const isDisabled = !dateInfo.isAvailable}
				<button
					type="button"
					aria-pressed={isSelected}
					onclick={() => !isDisabled && onSelectDate(dateInfo.date)}
					disabled={isDisabled}
					class={cn(
						"flex flex-col items-center rounded-2xl py-2.5 transition-all",
						isSelected && "scale-[1.03] shadow-md",
						!isSelected && !isDisabled && "text-foreground hover:bg-muted",
						isDisabled && "cursor-not-allowed opacity-30",
					)}
					style:background-color={isSelected ? primaryColor : undefined}
					style:color={isSelected ? inkOn(primaryColor) : undefined}
				>
					<span class="text-xs font-medium">{dateInfo.isToday ? "今天" : `週${dateInfo.dayOfWeek}`}</span>
					<span class="mt-0.5 text-lg font-bold">{dateInfo.dayNumber}</span>
				</button>
			{/each}
		</div>
	</div>
{/if}
