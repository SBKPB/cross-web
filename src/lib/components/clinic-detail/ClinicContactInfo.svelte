<script lang="ts">
	import MapPin from "@lucide/svelte/icons/map-pin";
	import Navigation from "@lucide/svelte/icons/navigation";
	import Phone from "@lucide/svelte/icons/phone";
	import { Button } from "$lib/components/ui/button/index.js";
	import type { Clinic } from "$lib/types/clinic";
	import SectionCard from "./SectionCard.svelte";

	let { clinic, class: className }: { clinic: Clinic; class?: string } = $props();

	const mapsUrl = $derived(
		clinic.address ? `https://maps.google.com/?q=${encodeURIComponent(clinic.address)}` : null,
	);
</script>

{#if clinic.address || clinic.phone}
	<SectionCard icon={MapPin} title="聯絡資訊" class={className}>
		<div class="space-y-3">
			{#if clinic.address}
				<div class="flex items-start gap-2.5">
					<MapPin class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<span class="text-sm leading-relaxed text-foreground">{clinic.address}</span>
				</div>
			{/if}
			{#if clinic.phone}
				<a
					href={`tel:${clinic.phone}`}
					class="flex items-center gap-2.5 text-foreground transition-colors hover:text-primary"
				>
					<Phone class="size-4 shrink-0 text-muted-foreground" />
					<span class="text-sm tabular-nums">{clinic.phone}</span>
				</a>
			{/if}

			{#if mapsUrl || clinic.phone}
				<!-- 圖示與文字間不留空白（與舊版 JSX 輸出相同） -->
				<div class="flex gap-2 pt-1">
					{#if mapsUrl}
						<Button
							href={mapsUrl}
							target="_blank"
							rel="noopener noreferrer"
							variant="outline"
							size="sm"
							class="flex-1"><Navigation class="size-4" />導航</Button
						>
					{/if}
					{#if clinic.phone}
						<Button href={`tel:${clinic.phone}`} variant="outline" size="sm" class="flex-1"
							><Phone class="size-4" />撥打</Button
						>
					{/if}
				</div>
			{/if}
		</div>
	</SectionCard>
{/if}
