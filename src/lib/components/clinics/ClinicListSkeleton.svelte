<script lang="ts">
	import { Card, CardContent, CardHeader } from "$lib/components/ui/card/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import { GRID_CLASS } from "./ClinicList.svelte";

	/** 載入中的骨架卡片網格，版面與真實卡片一致，避免內容跳動 */
	let { count = 6 }: { count?: number } = $props();
</script>

<div class={GRID_CLASS}>
	{#each Array.from({ length: count }, (_, i) => i) as i (i)}
		<Card aria-hidden="true">
			<CardHeader>
				<div class="space-y-2">
					<Skeleton class="h-5 w-20 rounded-full" />
					<Skeleton class="h-6 w-3/4" />
					<Skeleton class="h-4 w-24" />
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex gap-1.5">
					<Skeleton class="h-5 w-14 rounded-full" />
					<Skeleton class="h-5 w-14 rounded-full" />
					<Skeleton class="h-5 w-14 rounded-full" />
				</div>
				<div class="space-y-2">
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-1/2" />
				</div>
			</CardContent>
		</Card>
	{/each}
</div>
