<script lang="ts" module>
	export const GRID_CLASS = "grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
</script>

<script lang="ts">
	import SearchX from "@lucide/svelte/icons/search-x";
	import { Button } from "$lib/components/ui/button/index.js";
	import type { Clinic } from "$lib/types/clinic";
	import { cn } from "$lib/utils";
	import ClinicCard from "./ClinicCard.svelte";
	import ClinicDetailDialog from "./ClinicDetailDialog.svelte";

	let {
		clinics,
		class: className,
		onReset,
	}: {
		clinics: Clinic[];
		class?: string;
		onReset?: () => void;
	} = $props();

	let selectedClinic = $state<Clinic | null>(null);
	let dialogOpen = $state(false);
	// 正常清單以院所 ID 保留元件狀態；重複 ID 才退回位置，避免 Svelte 拒絕渲染。
	const hasDuplicateIds = $derived(new Set(clinics.map((clinic) => clinic.id)).size !== clinics.length);

	function handleCardClick(clinic: Clinic) {
		selectedClinic = clinic;
		dialogOpen = true;
	}
</script>

{#if clinics.length === 0}
	<div
		class={cn(
			"flex flex-col items-center justify-center rounded-3xl bg-card px-4 py-16 text-center ring-1 ring-border/60",
			className,
		)}
	>
		<div class="mb-4 flex size-16 items-center justify-center rounded-2xl bg-accent text-primary">
			<SearchX class="size-7" />
		</div>
		<h3 class="mb-1 text-lg font-semibold text-foreground">找不到符合條件的店家</h3>
		<p class="max-w-xs text-sm text-muted-foreground">
			試著放寬關鍵字或調整篩選條件，或許就能找到適合的選擇。
		</p>
		{#if onReset}
			<Button variant="outline" class="mt-5" onclick={onReset}>清除所有篩選</Button>
		{/if}
	</div>
{:else}
	<div class={cn(GRID_CLASS, className)}>
		{#each clinics as clinic, i (hasDuplicateIds ? `index:${i}` : `id:${clinic.id}`)}
			<ClinicCard {clinic} onClick={() => handleCardClick(clinic)} />
		{/each}
	</div>

	<ClinicDetailDialog clinic={selectedClinic} bind:open={dialogOpen} />
{/if}
