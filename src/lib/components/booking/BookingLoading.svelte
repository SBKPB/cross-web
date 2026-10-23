<script lang="ts">
	import { Skeleton } from "#lib/components/ui/skeleton/index.js";

	// 移植自舊版 app/booking/[clinic-id]/loading.tsx：預約資料載入中的骨架
</script>

<div class="min-h-[75vh] bg-background pb-24" role="status" aria-label="載入預約資訊中">
	<div class="bg-[#eff4fa] dark:bg-[#142238]">
		<div class="mx-auto max-w-3xl px-5 py-8">
			<Skeleton class="mb-6 h-4 w-28" />
			<div class="flex gap-4">
				<Skeleton class="size-16 shrink-0 rounded-2xl" />
				<div class="min-w-0 flex-1 space-y-3">
					<Skeleton class="h-4 w-40 max-w-full" />
					<Skeleton class="h-7 w-64 max-w-full" />
					<Skeleton class="h-4 w-48 max-w-full" />
				</div>
			</div>
		</div>
	</div>
	<div class="mx-auto max-w-2xl space-y-5 px-4 py-8">
		<Skeleton class="h-12 w-full rounded-2xl" />
		<div class="flex justify-center gap-8 py-3">
			{#each [1, 2, 3] as step (step)}<Skeleton class="size-8 rounded-full" />{/each}
		</div>
		<Skeleton class="h-7 w-40" />
		{#each [1, 2, 3] as step (step)}<Skeleton class="h-28 rounded-3xl" />{/each}
	</div>
</div>
