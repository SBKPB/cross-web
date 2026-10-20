<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { getSelectItems } from "./select.svelte";

	// 收合時的顯示文字比照舊版 Radix：值對不到 Root items 的任何選項時顯示空白
	// （Bits UI 預設把原始值當文字，例如網址帶進 /search?city=台北市 會顯示「台北市」）。
	// 其餘照 Bits UI 預設：對得到顯示選項文字、空值顯示 placeholder；呼叫端自帶 children / child 時照用。
	let { ref = $bindable(null), children: userChildren, ...restProps }: SelectPrimitive.ValueProps = $props();

	const getItems = getSelectItems();
	const known = (value: string) => {
		const items = getItems?.();
		return !items || items.some((item) => item.value === value);
	};
</script>

<!-- 分支彼此緊貼書寫，不留空白文字節點（與 Bits UI 預設輸出相同） -->
<SelectPrimitive.Value bind:ref data-slot="select-value" {...restProps}
	>{#snippet children(props)}{#if userChildren}{@render userChildren(props)}{:else if props.selection.type === "single"}{#if !props.selection.selected}{props.placeholder}{:else if known(props.selection.selected.value)}{props.selection.selected.label}{/if}{:else if props.selection.selected.length > 0}{props.selection.selected
				.map((selected) => selected.label)
				.join(", ")}{:else}{props.placeholder}{/if}{/snippet}</SelectPrimitive.Value
>
