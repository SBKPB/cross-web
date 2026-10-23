<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { buttonVariants } from "#lib/components/ui/button/index.js";
	import { cn } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CalendarPrimitive.DayProps = $props();
</script>

<CalendarPrimitive.Day
	bind:ref
	class={cn(
		buttonVariants({ variant: "ghost", size: "icon" }),
		"relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 rounded-(--cell-radius) border-0 leading-none font-normal focus-visible:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
		"[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground",
		"data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-md",
		"[&[data-outside-month]:not([data-selected])]:text-muted-foreground",
		"data-[disabled]:text-muted-foreground data-[disabled]:opacity-40",
		"data-[unavailable]:text-muted-foreground data-[unavailable]:line-through",
		className
	)}
	{...restProps}
/>
