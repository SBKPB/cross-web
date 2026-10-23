<script lang="ts">
	import Check from "@lucide/svelte/icons/check";
	import User from "@lucide/svelte/icons/user";
	import { inkOn } from "#lib/color-contrast.ts";
	import type { DoctorOption } from "#lib/types/booking.ts";
	import { cn } from "#lib/utils.ts";

	// 移植自舊版 components/booking/doctor-card.tsx
	let {
		doctor,
		isSelected,
		onSelect,
		primaryColor = "#1d4ed8",
	}: {
		doctor: DoctorOption;
		isSelected: boolean;
		onSelect: (doctor: DoctorOption) => void;
		primaryColor?: string;
	} = $props();
</script>

<button
	type="button"
	aria-pressed={isSelected}
	onclick={() => onSelect(doctor)}
	class={cn(
		"flex w-28 shrink-0 snap-start flex-col items-center rounded-3xl p-3 transition-all",
		isSelected
			? "bg-card shadow-md ring-1 ring-foreground/5"
			: "ring-1 ring-transparent hover:bg-card/70 hover:ring-foreground/5",
	)}
>
	<!-- Avatar -->
	<div
		class="relative size-16 overflow-hidden rounded-full transition-all"
		style:box-shadow={isSelected ? `0 0 0 3px ${primaryColor}` : undefined}
	>
		{#if doctor.avatar}
			<!-- 舊版 next/image fill 的輸出（lazy） -->
			<img
				src={doctor.avatar}
				alt={doctor.name}
				loading="lazy"
				decoding="async"
				class="object-cover"
				style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent"
			/>
		{:else}
			<div class="flex size-full items-center justify-center bg-accent/60 text-primary">
				<User class="size-7" />
			</div>
		{/if}

		<!-- Selection Check -->
		{#if isSelected}
			<div
				class="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full ring-2 ring-card"
				style:background-color={primaryColor}
				style:color={inkOn(primaryColor)}
			>
				<Check class="size-3" strokeWidth={3} />
			</div>
		{/if}
	</div>

	<!-- Name & Title -->
	<div class="mt-2.5 text-center">
		<p class={cn("truncate text-sm font-medium", isSelected ? "text-foreground" : "text-foreground/80")}>
			{doctor.name}
		</p>
		<p class="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{doctor.title}</p>
	</div>
</button>
