<script lang="ts">
	import { Checkbox } from "#lib/components/ui/checkbox/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { Textarea } from "#lib/components/ui/textarea/index.js";
	import { inkOn } from "#lib/color-contrast.ts";
	import { getBookingStore } from "./booking-context.svelte";

	// 移植自舊版 components/booking/booking-form.tsx：備註與同意條款（存在預約流程狀態）
	let { primaryColor = "#1d4ed8" }: { primaryColor?: string } = $props();

	const store = getBookingStore();
	const formData = $derived(store.state.formData);

	// 白勾勾只在深色品牌色上讀得到；淺色品牌色要換深色勾（舊版 style：未同意時三個屬性都是 undefined＝不輸出）
	const checkboxStyle = $derived(
		formData.privacyAccepted
			? `background-color: ${primaryColor}; border-color: ${primaryColor}; color: ${inkOn(primaryColor)};`
			: undefined,
	);
</script>

<div class="space-y-5">
	<div class="space-y-2">
		<Label for="notes" class="text-sm text-muted-foreground">備註（選填）</Label>
		<Textarea
			id="notes"
			placeholder="如有特殊需求請在此說明"
			value={formData.notes}
			oninput={(e) => store.dispatch({ type: "SET_FORM_DATA", payload: { notes: e.currentTarget.value } })}
			rows={3}
			class="rounded-2xl"
		/>
	</div>

	<div class="flex items-start gap-2.5 rounded-2xl bg-muted/40 p-4">
		<Checkbox
			id="privacy"
			checked={formData.privacyAccepted}
			onCheckedChange={(checked) =>
				store.dispatch({ type: "SET_FORM_DATA", payload: { privacyAccepted: checked === true } })}
			class="mt-0.5"
			style={checkboxStyle}
		/>
		<Label for="privacy" class="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground">
			我已閱讀並同意 <a
				href="/privacy"
				target="_blank"
				class="font-medium underline underline-offset-2"
				style:color={primaryColor}>隱私權政策</a
			> 及 <a href="/terms" target="_blank" class="font-medium underline underline-offset-2" style:color={primaryColor}
				>服務條款</a
			>
		</Label>
	</div>
</div>
