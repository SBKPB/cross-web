<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CalendarPrimitive.HeaderProps = $props();
</script>

<CalendarPrimitive.Header
	bind:ref
	class={cn(
		"flex h-(--cell-size) w-full items-center justify-center gap-1.5 px-(--cell-size) text-base font-semibold text-foreground select-none",
		className
	)}
	{...restProps}
/>
