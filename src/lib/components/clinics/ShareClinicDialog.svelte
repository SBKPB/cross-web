<script lang="ts">
	import { onMount } from "svelte";
	import QRCode from "qrcode";
	import Check from "@lucide/svelte/icons/check";
	import Copy from "@lucide/svelte/icons/copy";
	import Download from "@lucide/svelte/icons/download";
	import ExternalLink from "@lucide/svelte/icons/external-link";
	import Share2 from "@lucide/svelte/icons/share-2";
	import { Button } from "#lib/components/ui/button/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from "#lib/components/ui/dialog/index.js";
	import { Input } from "#lib/components/ui/input/index.js";

	// 民眾端正式網域（與 layout metadataBase 一致）
	const SITE_URL = "https://cross.twinhao.com";

	let {
		clinicId,
		clinicName,
		open = $bindable(false),
		onOpenChange,
	}: {
		clinicId: string;
		clinicName: string;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	} = $props();

	// 短網址：/c/{UUID 前 8 碼} → 自動轉到完整診所頁（見 routes/c/[code]）
	const url = $derived(`${SITE_URL}/c/${clinicId.slice(0, 8)}`);
	let qrDataUrl = $state("");
	let copied = $state(false);
	let canNativeShare = $state(false);

	onMount(() => {
		canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
	});

	// 開啟時產生 QR Code（512px PNG data URL，供預覽與下載）
	$effect(() => {
		if (!open) return;
		let cancelled = false;
		QRCode.toDataURL(url, {
			width: 512,
			margin: 2,
			color: { dark: "#0f172a", light: "#ffffff" },
		})
			.then((dataUrl) => {
				if (!cancelled) qrDataUrl = dataUrl;
			})
			.catch(() => {
				if (!cancelled) qrDataUrl = "";
			});
		return () => {
			cancelled = true;
		};
	});

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// 剪貼簿不可用時使用者仍可手動選取複製
		}
	}

	async function handleNativeShare() {
		try {
			await navigator.share({ title: clinicName, text: `${clinicName}｜Cross`, url });
		} catch {
			// 使用者取消或裝置不支援 → 忽略
		}
	}

	function handleDownload() {
		if (!qrDataUrl) return;
		const a = document.createElement("a");
		a.href = qrDataUrl;
		a.download = `${clinicName}-QRcode.png`;
		document.body.appendChild(a);
		a.click();
		a.remove();
	}
</script>

<Dialog bind:open {onOpenChange}>
	<DialogContent class="sm:max-w-[420px]">
		<DialogHeader>
			<DialogTitle>分享診所頁面</DialogTitle>
			<DialogDescription>
				掃描 QR Code 或複製連結，把這個診所頁面分享出去；對方可直接查看並線上預約。
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-5">
			<!-- QR Code 預覽 -->
			<div class="flex flex-col items-center gap-3">
				{#if qrDataUrl}
					<img
						src={qrDataUrl}
						alt={`${clinicName} QR Code`}
						class="size-52 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-border"
					/>
				{:else}
					<div class="size-52 animate-pulse rounded-3xl bg-muted"></div>
				{/if}
				<p class="text-center text-sm font-medium text-foreground">
					{clinicName}
				</p>
			</div>

			<!-- 連結 + 複製 -->
			<div class="flex gap-2">
				<Input
					readonly
					value={url}
					onfocus={(e) => e.currentTarget.select()}
					class="h-11 flex-1 bg-secondary/70 text-sm"
				/>
				<Button
					variant="outline"
					size="icon"
					class="h-11 w-11 shrink-0"
					onclick={handleCopy}
					aria-label="複製連結"
				>
					{#if copied}
						<Check class="size-4 text-primary" />
					{:else}
						<Copy class="size-4" />
					{/if}
				</Button>
			</div>

			<!-- 動作（圖示與文字間不留空白，與舊版 JSX 輸出相同） -->
			{#if canNativeShare}
				<Button class="w-full gap-2" onclick={handleNativeShare}><Share2 class="size-4" />分享給朋友</Button>
			{/if}
			<div class="flex gap-2">
				<Button
					variant={canNativeShare ? "outline" : "default"}
					class="flex-1 gap-2"
					onclick={handleDownload}
					disabled={!qrDataUrl}><Download class="size-4" />下載 QR Code</Button
				>
				<Button
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					variant="outline"
					class="flex-1 gap-2"><ExternalLink class="size-4" />開啟頁面</Button
				>
			</div>
		</div>
	</DialogContent>
</Dialog>
