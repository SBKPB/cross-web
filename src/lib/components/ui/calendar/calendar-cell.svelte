<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { cn } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CalendarPrimitive.CellProps = $props();
</script>

<CalendarPrimitive.Cell
	bind:ref
	class={cn(
		"group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none focus-within:z-20",
		className
	)}
	{...restProps}
/>
