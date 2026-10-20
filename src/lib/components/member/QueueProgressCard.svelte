<script lang="ts">
	import BellRing from "@lucide/svelte/icons/bell-ring";
	import type { MemberQueueStatus } from "$lib/api/member-appointment";
	import { Card } from "$lib/components/ui/card/index.js";
	import { cn } from "$lib/utils";

	/** 看診進度卡：目前叫號 / 您的號碼 / 還差 N 位；輪到本人時整卡高亮（移植自舊版 QueueProgressCard） */
	let { status }: { status: MemberQueueStatus } = $props();
	const isMyTurn = $derived(status.status === "in_progress");
</script>

<Card class={cn("space-y-4 p-5", isMyTurn && "ring-2 ring-primary/40")}>
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2 text-sm font-semibold text-foreground">
			<BellRing class={cn("size-4 text-primary", isMyTurn && "animate-pulse")} />
			看診進度
		</div>
		<span class="text-xs text-muted-foreground">每 15 秒自動更新</span>
	</div>

	{#if isMyTurn}
		<div class="rounded-2xl bg-primary p-3 text-center text-sm font-bold text-primary-foreground">
			輪到您了！請前往診間
		</div>
	{/if}

	<div class="grid grid-cols-3 divide-x divide-border/60 text-center">
		<div class="space-y-1 px-2">
			<p class="text-xs text-muted-foreground">目前叫號</p>
			<p class="text-2xl font-bold text-primary tabular-nums">{status.current_number ?? "—"}</p>
		</div>
		<div class="space-y-1 px-2">
			<p class="text-xs text-muted-foreground">您的號碼</p>
			<p class={cn("text-2xl font-bold tabular-nums", isMyTurn ? "text-primary" : "text-foreground")}>
				{status.queue_number ?? "—"}
			</p>
		</div>
		<div class="space-y-1 px-2">
			<p class="text-xs text-muted-foreground">還差</p>
			<p class="text-2xl font-bold text-foreground tabular-nums">
				{isMyTurn ? 0 : (status.ahead_count ?? "—")}<span
					class="ml-0.5 text-sm font-medium text-muted-foreground">位</span
				>
			</p>
		</div>
	</div>

	{#if !isMyTurn && status.estimated_wait_minutes != null}
		<p class="text-center text-xs text-muted-foreground">
			預估等候約 <span class="font-semibold text-foreground tabular-nums">{status.estimated_wait_minutes}</span> 分鐘
		</p>
	{/if}

	{#if status.status === "confirmed"}
		<p class="text-center text-xs text-muted-foreground">抵達後請先至櫃檯報到，報到後即可掌握即時進度。</p>
	{/if}
</Card>
