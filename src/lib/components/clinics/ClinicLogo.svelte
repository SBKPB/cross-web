<script lang="ts">
	import { Avatar, AvatarImage, AvatarFallback } from "$lib/components/ui/avatar/index.js";
	import { cn } from "$lib/utils";

	let { logo, name, class: className }: { logo?: string | null; name: string; class?: string } = $props();
</script>

<!-- 換圖時重新載入，不沿用舊網址的成功或失敗狀態；院所名稱由相鄰標題提供。 -->
{#key logo}
	<Avatar class={cn("size-14 overflow-hidden rounded-2xl after:rounded-2xl", className)} aria-hidden="true">
		<AvatarImage src={logo ?? undefined} alt="" width={56} height={56} class="rounded-2xl bg-white object-contain p-1" />
		<AvatarFallback class="rounded-2xl bg-accent/60 text-2xl font-medium text-primary">
			{name.slice(0, 1)}
		</AvatarFallback>
	</Avatar>
{/key}
