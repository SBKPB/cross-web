<script lang="ts" module>
	import { getContext, setContext } from "svelte";

	type SelectItems = { value: string; label: string }[] | undefined;
	const ITEMS = Symbol("select-items");

	/** SelectValue 用：取得 Root 的 items（沒有包在本元件裡時回傳 undefined） */
	export function getSelectItems(): (() => SelectItems) | undefined {
		return getContext<(() => SelectItems) | undefined>(ITEMS);
	}
</script>

<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";

	let {
		open = $bindable(false),
		value = $bindable(),
		...restProps
	}: SelectPrimitive.RootProps = $props();

	setContext(ITEMS, () => restProps.items);
</script>

<SelectPrimitive.Root bind:open bind:value={value as never} {...restProps} />
