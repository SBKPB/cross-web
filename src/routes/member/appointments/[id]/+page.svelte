<script lang="ts">
	import AppointmentDetail from "$lib/components/member/AppointmentDetail.svelte";

	// 移植自舊版 app/member/appointments/[id]/page.tsx：換 id 時整頁重建（Next 以路由參數為 key 重新掛載）
	let { data } = $props();
</script>

{#key data.id}
	<AppointmentDetail id={data.id} />
{/key}
