<script lang="ts" module>
	function formatDate(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return "";
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${d.getFullYear()}/${m}/${day}`;
	}
</script>

<script lang="ts">
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import Megaphone from "@lucide/svelte/icons/megaphone";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import type { AnnouncementPublic } from "$lib/types/clinic";
	import SectionCard from "./SectionCard.svelte";

	let { announcements, class: className }: { announcements: AnnouncementPublic[]; class?: string } = $props();

	let selected = $state<AnnouncementPublic | null>(null);
</script>

{#if announcements.length > 0}
	<SectionCard icon={Megaphone} title="公告" class={className}>
		<div class="divide-y divide-border">
			<!-- 後端資料可能有重複 id：以索引為 key（同舊版 React 只警告、照樣渲染） -->
			{#each announcements as a, i (i)}
				<button
					type="button"
					onclick={() => (selected = a)}
					class="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/40"
				>
					<div class="min-w-0">
						<p class="truncate text-sm font-medium text-foreground">{a.title ?? a.content}</p>
						<p class="mt-0.5 text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
					</div>
					<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
				</button>
			{/each}
		</div>
	</SectionCard>

	<Dialog
		bind:open={
			() => selected !== null,
			(open) => {
				if (!open) selected = null;
			}
		}
	>
		<DialogContent class="sm:max-w-[480px]">
			<DialogHeader>
				<DialogTitle>{selected?.title ?? "公告"}</DialogTitle>
				<DialogDescription>{selected ? formatDate(selected.created_at) : ""}</DialogDescription>
			</DialogHeader>
			<p class="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{selected?.content}</p>
		</DialogContent>
	</Dialog>
{/if}
