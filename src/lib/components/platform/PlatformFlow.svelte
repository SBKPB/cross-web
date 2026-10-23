<script lang="ts" module>
	import waveform from "../../../../static/developers/ecg-waveform.json";

	const points = waveform.samples
		.map(
			(sample, index) =>
				`${((index * 500) / (waveform.samples.length - 1)).toFixed(2)},${(105 - sample / 12).toFixed(2)}`,
		)
		.join(" ");

	// 背景格線：直線 11 條（每 50）、橫線 6 條（每 30）
	const GRID_X = Array.from({ length: 11 }, (_, index) => index * 50);
	const GRID_Y = Array.from({ length: 6 }, (_, index) => index * 30);
</script>

<script lang="ts">
	import ArrowRight from "@lucide/svelte/icons/arrow-right";
	import Database from "@lucide/svelte/icons/database";
	import Smartphone from "@lucide/svelte/icons/smartphone";
	import Waves from "@lucide/svelte/icons/waves";
	import { Card, CardContent } from "#lib/components/ui/card/index.js";

	const STEPS = [
		{ icon: Waves, label: "合成訊號" },
		{ icon: Smartphone, label: "原生 App" },
		{ icon: Database, label: "Cross API" },
	];
</script>

<Card class="relative gap-0 border border-border/60 bg-card/95 py-0 shadow-xl shadow-primary/5">
	<CardContent class="p-5 sm:p-7">
		<div class="flex items-center justify-between gap-4">
			<span class="font-mono text-xs tracking-wider text-muted-foreground">CROSS / DATA FLOW</span>
			<span class="rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-primary">沙盒資料示意</span>
		</div>
		<div class="mt-7 flex items-center justify-between gap-2">
			{#each STEPS as item, index (item.label)}
				<div class="contents">
					{#if index > 0}
						<ArrowRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					{/if}
					<div class="flex flex-1 flex-col items-center gap-3 rounded-2xl bg-muted/60 px-2 py-5">
						<item.icon class="size-5 text-primary" aria-hidden="true" />
						<span class="text-xs font-medium sm:text-sm">{item.label}</span>
					</div>
				</div>
			{/each}
		</div>
		<div class="mt-6 overflow-hidden rounded-2xl border border-border">
			<div class="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
				<span class="text-sm font-medium">ECG · 導程 I</span>
				<span class="font-mono text-xs text-muted-foreground">250 Hz / 500 samples</span>
			</div>
			<svg
				viewBox="0 0 500 150"
				class="h-auto w-full text-primary"
				role="img"
				aria-label="2 秒的合成單導程 ECG 波形，僅供流程示意"
			>
				{#each GRID_X as x (x)}
					<line
						x1={x}
						x2={x}
						y1="0"
						y2="150"
						class="stroke-border"
						stroke-width="0.6"
					/>
				{/each}
				{#each GRID_Y as y (y)}
					<line
						x1="0"
						x2="500"
						y1={y}
						y2={y}
						class="stroke-border"
						stroke-width="0.6"
					/>
				{/each}
				<polyline
					{points}
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linejoin="round"
				/>
			</svg>
			<div class="flex justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
				<span>單位 µV · 合成訊號</span>
				<span>2.0 秒</span>
			</div>
		</div>
		<div class="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
			{#each ["先保存", "原樣補傳", "讀回核對"] as label, index (label)}
				<span class="rounded-full border border-border px-3 py-1.5"
					><span class="mr-2 font-mono text-primary">0{index + 1}</span>{label}</span
				>
			{/each}
		</div>
	</CardContent>
</Card>
