<script lang="ts">
	import AlertTriangle from "@lucide/svelte/icons/triangle-alert";
	import { Button } from "#lib/components/ui/button/index.js";

	// 移植自舊版 components/booking/booking-error.tsx：預約資料載入失敗（後端任一請求失敗）
	const handleRetry = () => {
		window.location.reload();
	};
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-background px-4">
	<div class="w-full max-w-md rounded-4xl bg-card p-10 text-center shadow-md ring-1 ring-foreground/5">
		<div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
			<AlertTriangle class="size-8 text-destructive" />
		</div>
		<h1 class="mb-2 text-xl font-semibold text-foreground">伺服器異常</h1>
		<p class="mb-6 text-muted-foreground">無法載入預約資料，請稍後再試</p>
		<Button onclick={handleRetry} class="w-full" size="lg">重新整理</Button>
	</div>
</div>
