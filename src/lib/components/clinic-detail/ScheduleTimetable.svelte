<script lang="ts" module>
	import type { ScheduleEntry, ScheduleSession } from "$lib/types/schedule";

	const SESSIONS: { key: ScheduleSession; label: string; hint: string }[] = [
		{ key: "morning", label: "早診", hint: "上午" },
		{ key: "afternoon", label: "午診", hint: "下午" },
		{ key: "evening", label: "晚診", hint: "晚上" },
	];

	const DAY_LABELS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

	const GRID_COLS = "grid grid-cols-[58px_repeat(7,minmax(74px,1fr))] gap-1.5";

	function ymd(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	}

	function md(d: Date): string {
		return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
	}

	function parseLocalDate(s: string): Date {
		const [y, m, d] = s.split("-").map(Number);
		return new Date(y, m - 1, d);
	}
</script>

<script lang="ts">
	import CalendarDays from "@lucide/svelte/icons/calendar-days";
	import type { WeeklySchedule } from "$lib/types/schedule";
	import { cn } from "$lib/utils";
	import SectionCard from "./SectionCard.svelte";

	let { schedule, class: className }: { schedule: WeeklySchedule; class?: string } = $props();

	const weekStart = $derived(parseLocalDate(schedule.week_start));
	const weekEnd = $derived(parseLocalDate(schedule.week_end));
	// 同舊版：以執行環境的時區判定今天（SSR 與瀏覽器跨日不同時，hydration 會改成瀏覽器的值）
	const todayKey = ymd(new Date());

	// 週一起連續 7 天（同舊版 new Date(weekStart) 再 setDate(+i)，跨月由 Date 自動進位）
	const dayDates = $derived(
		DAY_LABELS.map((_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)),
	);

	// 「診次-星期」→ 該格醫師（同一格依 doctor_id 去重）
	const cellMap = $derived.by(() => {
		const cells: Record<string, ScheduleEntry[]> = {};
		for (const e of schedule.entries) {
			const list = (cells[`${e.session}-${e.weekday}`] ??= []);
			if (!list.some((x) => x.doctor_id === e.doctor_id)) list.push(e);
		}
		return cells;
	});

	const rangeLabel = $derived(`${md(weekStart)} – ${md(weekEnd)}`);
</script>

<SectionCard icon={CalendarDays} title="門診時刻表" class={className}>
	{#snippet action()}
		<span
			class="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground tabular-nums"
			>{schedule.week_offset === 0 ? "本週 " : ""}{rangeLabel}</span
		>
	{/snippet}

	{#if schedule.entries.length === 0}
		<div class="flex flex-col items-center gap-1.5 py-10 text-center">
			<span class="mb-1 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground/50">
				<CalendarDays class="size-6" />
			</span>
			<p class="text-sm font-medium text-foreground">本週尚未提供門診排班</p>
			<p class="text-xs text-muted-foreground">可點「立即預約」查詢可預約時段</p>
		</div>
	{:else}
		<div class="min-w-0 overflow-x-auto pb-1">
			<div class="min-w-[560px]">
				<!-- 表頭 -->
				<div class={GRID_COLS}>
					<div class="sticky left-0 z-10 bg-card"></div>
					{#each dayDates as d, i (i)}
						{@const isToday = ymd(d) === todayKey}
						<div
							class={cn(
								"rounded-2xl px-1 py-2 text-center transition-colors",
								isToday ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" : "bg-muted/70",
							)}
						>
							<div class="text-xs font-semibold">{DAY_LABELS[i]}</div>
							<div
								class={cn(
									"mt-0.5 text-[10px] tabular-nums",
									isToday ? "text-primary-foreground/85" : "text-muted-foreground",
								)}
							>
								{md(d)}
							</div>
						</div>
					{/each}
				</div>

				<!-- 診次列 -->
				{#each SESSIONS as s (s.key)}
					<div class={cn(GRID_COLS, "mt-1.5")}>
						<div
							class="sticky left-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-secondary px-1 py-2 text-center"
						>
							<span class="text-xs font-semibold text-foreground">{s.label}</span>
							<span class="text-[10px] text-muted-foreground">{s.hint}</span>
						</div>

						{#each dayDates as d, i (i)}
							{@const isToday = ymd(d) === todayKey}
							{@const doctors = cellMap[`${s.key}-${i}`] ?? []}
							<div
								class={cn(
									"flex min-h-[3.25rem] flex-wrap content-center items-center justify-center gap-1 rounded-2xl p-1.5",
									isToday ? "bg-accent/70 ring-1 ring-inset ring-primary/15" : "bg-muted/40",
								)}
							>
								{#if doctors.length > 0}
									<!-- 同一格已依 doctor_id 去重；仍以索引為 key，後端資料異常也不會丟錯 -->
									{#each doctors as doc, j (j)}
										<span
											title={doc.department ? `${doc.doctor_name}・${doc.department}` : doc.doctor_name}
											class="max-w-full truncate rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm ring-1 ring-foreground/5"
										>
											{doc.doctor_name}
										</span>
									{/each}
								{:else}
									<span class="self-center text-xs text-muted-foreground/40">—</span>
								{/if}
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</SectionCard>
