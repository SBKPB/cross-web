<script lang="ts">
	import AlertCircle from "@lucide/svelte/icons/circle-alert";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Button } from "$lib/components/ui/button/index.js";

	let { open, onConfirm }: { open: boolean; onConfirm: () => void } = $props();
</script>

<!-- 與舊版相同：受控開啟，Esc 與點擊外側都不會關閉，只能按「前往登入」 -->
<Dialog.Root {open}>
	<Dialog.Content
		showCloseButton={false}
		escapeKeydownBehavior="ignore"
		interactOutsideBehavior="ignore"
		class="sm:max-w-md"
	>
		<Dialog.Header>
			<div
				class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30"
			>
				<AlertCircle class="h-6 w-6 text-amber-600 dark:text-amber-400" />
			</div>
			<Dialog.Title class="text-center">登入已過期</Dialog.Title>
			<Dialog.Description class="text-center">
				您的登入憑證已過期，請重新登入以繼續使用系統。
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="sm:justify-center">
			<Button onclick={onConfirm} class="w-full sm:w-auto">前往登入</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
