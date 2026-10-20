<script lang="ts">
	import { NO_PREFERENCE_DOCTOR } from "$lib/constants/booking-constants";
	import type { DoctorOption } from "$lib/types/booking";
	import DoctorCard from "./DoctorCard.svelte";

	// 移植自舊版 components/booking/doctor-selector.tsx
	let {
		doctors,
		selectedDoctor,
		onSelectDoctor,
		primaryColor,
	}: {
		doctors: DoctorOption[];
		selectedDoctor: DoctorOption | null;
		onSelectDoctor: (doctor: DoctorOption) => void;
		primaryColor?: string;
	} = $props();

	const allOptions = $derived([NO_PREFERENCE_DOCTOR, ...doctors]);
</script>

<div class="space-y-7 px-4">
	<div class="space-y-1">
		<h2 class="text-2xl font-semibold tracking-tight text-foreground">選擇看診人員</h2>
		<p class="text-sm text-muted-foreground">可指定特定人員，或交由系統安排</p>
	</div>

	<div class="rounded-3xl bg-card p-4 border border-border/80 sm:p-5">
		<div class="-mx-1 overflow-x-auto px-1">
			<div class="flex snap-x snap-mandatory gap-2 pb-1">
				<!-- 人員清單來自後端，不以 id 當 key（重複 id 時 keyed each 會丟錯，舊版 React 只警告） -->
				{#each allOptions as doctor, i (i)}
					<DoctorCard
						{doctor}
						isSelected={selectedDoctor?.id === doctor.id}
						onSelect={onSelectDoctor}
						{primaryColor}
					/>
				{/each}
			</div>
		</div>
	</div>
</div>
