<script lang="ts">
	import Check from "@lucide/svelte/icons/check";
	import { inkOn } from "#lib/color-contrast.ts";
	import { BOOKING_STEPS } from "#lib/constants/booking-constants.ts";
	import { cn } from "#lib/utils.ts";

	// 移植自舊版 components/booking/booking-stepper.tsx
	let {
		currentStep,
		onStepClick,
		primaryColor = "#1d4ed8",
	}: {
		currentStep: 1 | 2 | 3;
		onStepClick?: (step: 1 | 2 | 3) => void;
		primaryColor?: string;
	} = $props();
</script>

<div class="mx-auto flex max-w-2xl items-center justify-center gap-1 px-4 py-3.5 sm:gap-2">
	{#each BOOKING_STEPS as { step, label }, index (step)}
		{@const isCompleted = currentStep > step}
		{@const isCurrent = currentStep === step}
		{@const isClickable = !!onStepClick && step < currentStep}
		{@const isActive = isCompleted || isCurrent}
		<div class="flex items-center">
			<!-- Step Circle -->
			<button
				type="button"
				aria-label={`第 ${step} 步：${label}`}
				aria-current={isCurrent ? "step" : undefined}
				onclick={() => isClickable && onStepClick?.(step)}
				disabled={!isClickable}
				class={cn(
					"flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
					"ring-1 ring-foreground/5",
					isCompleted && "shadow-sm",
					isCurrent && "shadow-md ring-2 ring-offset-2 ring-offset-background",
					!isActive && "bg-muted text-muted-foreground",
					isClickable && "cursor-pointer hover:opacity-90",
				)}
				style:background-color={isActive ? primaryColor : undefined}
				style:color={isActive ? inkOn(primaryColor) : undefined}
				style:--tw-ring-color={isCurrent ? primaryColor : undefined}
			>
				{#if isCompleted}<Check class="size-4" strokeWidth={3} />{:else}{step}{/if}
			</button>

			<!-- Step Label — 手機只顯示目前步驟 label，桌機全顯示 -->
			<span
				class={cn(
					"ml-2 text-sm transition-colors",
					isCurrent ? "font-semibold text-foreground" : "hidden text-muted-foreground sm:inline",
				)}>{label}</span
			>

			<!-- Connector Line -->
			{#if index < BOOKING_STEPS.length - 1}
				<div
					class={cn("mx-2.5 h-0.5 w-5 rounded-full transition-colors sm:w-8", currentStep > step ? "" : "bg-muted")}
					style:background-color={currentStep > step ? primaryColor : undefined}
				></div>
			{/if}
		</div>
	{/each}
</div>
