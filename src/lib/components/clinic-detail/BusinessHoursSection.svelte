<script lang="ts">
	import Clock from "@lucide/svelte/icons/clock";
	import type { BusinessHours } from "$lib/types/clinic";
	import { cn } from "$lib/utils";
	import SectionCard from "./SectionCard.svelte";

	let { businessHours, class: className }: { businessHours: BusinessHours[]; class?: string } = $props();

	// 同舊版：以執行環境的時區判定今天（SSR 與瀏覽器跨日不同時，hydration 會改成瀏覽器的值）
	const today = new Date().getDay();
	const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
	const todayName = dayNames[today];
</script>

{#if businessHours.length > 0}
	<SectionCard icon={Clock} title="營業時間" class={className}>
		<div class="space-y-0.5">
			<!-- 後端資料可能有重複的星期：以索引為 key（同舊版 React 只警告、照樣渲染） -->
			{#each businessHours as hours, i (i)}
				{@const isToday = hours.day === todayName}
				<div
					class={cn(
						"flex items-center justify-between rounded-xl px-3 py-2 transition-colors",
						isToday ? "bg-accent" : "hover:bg-muted",
					)}
				>
					<span
						class={cn(
							"flex items-center gap-2 text-sm",
							isToday ? "font-semibold text-accent-foreground" : "text-foreground",
						)}
						>{#if isToday}<span class="size-1.5 rounded-full bg-primary"></span>{/if}{hours.day}{isToday
							? "（今日）"
							: ""}</span
					>
					<div class="text-right">
						<span
							class={cn(
								"text-sm tabular-nums",
								hours.is_closed
									? "text-muted-foreground"
									: isToday
										? "font-semibold text-accent-foreground"
										: "text-foreground",
							)}
						>
							{hours.is_closed ? "休息" : `${hours.open} - ${hours.close}`}
						</span>
						{#if !hours.is_closed && hours.breaks && hours.breaks.length > 0}
							<div class="text-xs text-muted-foreground">
								休息 {hours.breaks.map((b) => `${b.start}-${b.end}`).join("、")}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</SectionCard>
{/if}
