<script lang="ts">
	import MapPinned from "@lucide/svelte/icons/map-pinned";
	import Phone from "@lucide/svelte/icons/phone";
	import Store from "@lucide/svelte/icons/store";
	import { Button } from "#lib/components/ui/button/index.js";
	import { cn } from "#lib/utils.ts";

	/** 未開通線上預約的院所：顯示現場預約；電話預約由後台勾選才顯示 */
	let {
		phone,
		phoneBookingEnabled = false,
		class: className,
	}: {
		phone?: string | null;
		/** 後台勾選是否提供電話預約（預設關閉）；關閉時只顯示現場預約 */
		phoneBookingEnabled?: boolean;
		class?: string;
	} = $props();

	const showPhone = $derived(phoneBookingEnabled && !!phone);
</script>

<div class={cn("rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5", className)}>
	<div class="flex items-center gap-2.5">
		<span class="inline-flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
			<Store class="size-5" />
		</span>
		<h3 class="text-lg font-bold text-foreground">現場預約</h3>
	</div>
	<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
		{showPhone
			? "本院所目前提供現場 / 電話預約，歡迎來電或臨櫃洽詢。"
			: "本院所目前提供現場預約，歡迎臨櫃洽詢。"}
	</p>

	{#if showPhone}
		<!-- 圖示與文字間不留空白（與舊版 JSX 輸出相同） -->
		<Button href={`tel:${phone}`} size="lg" class="mt-5 w-full font-semibold"
			><Phone class="size-5" />撥打電話 {phone}</Button
		>
	{/if}

	<div class="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
		<span class="flex items-center gap-1.5"
			><MapPinned class="size-3.5" />{showPhone ? "現場 / 電話即可預約" : "現場即可預約"}</span
		>
	</div>
</div>
