<script lang="ts">
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#lib/components/ui/select/index.js";

	// 每一列一個收合的 Select；測試讀各列 [data-slot=select-value] 的文字
	const items = [
		{ value: "all", label: "全部縣市" },
		{ value: "臺北市", label: "臺北市" },
		{ value: "clinic", label: "診所" },
	];
	const cases = [
		{ id: "valid", value: "clinic" },
		{ id: "same-label", value: "臺北市" },
		{ id: "invalid", value: "台北市" },
		{ id: "empty", value: "" },
		{ id: "empty-placeholder", value: "", placeholder: "請選擇" },
		{ id: "invalid-placeholder", value: "bogus", placeholder: "請選擇" },
	];
	let changeable = $state("不存在");
</script>

{#each cases as c (c.id)}
	<div id={c.id}>
		<Select type="single" {items} value={c.value}>
			<SelectTrigger aria-label={c.id}><SelectValue placeholder={c.placeholder} /></SelectTrigger>
			<SelectContent>
				{#each items as item (item.value)}
					<SelectItem value={item.value} label={item.label} />
				{/each}
			</SelectContent>
		</Select>
	</div>
{/each}

<!-- 外部改值：無效 → 有效時要顯示對應文字 -->
<div id="changeable">
	<Select type="single" {items} value={changeable} onValueChange={(v) => (changeable = v)}>
		<SelectTrigger aria-label="changeable"><SelectValue /></SelectTrigger>
		<SelectContent>
			{#each items as item (item.value)}
				<SelectItem value={item.value} label={item.label} />
			{/each}
		</SelectContent>
	</Select>
</div>
<button id="fix" type="button" onclick={() => (changeable = "all")}>改成有效值</button>

<!-- 呼叫端自帶 children：照用呼叫端的內容 -->
<div id="custom">
	<Select type="single" {items} value="台北市">
		<SelectTrigger aria-label="custom"
			><SelectValue>{#snippet children({ selection })}自訂：{selection.type === "single" ? selection.selected?.value : ""}{/snippet}</SelectValue
			></SelectTrigger
		>
		<SelectContent>
			{#each items as item (item.value)}
				<SelectItem value={item.value} label={item.label} />
			{/each}
		</SelectContent>
	</Select>
</div>
