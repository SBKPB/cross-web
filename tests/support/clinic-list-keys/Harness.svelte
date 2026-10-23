<script lang="ts">
	// 只供 tests/clinic-list-keys.test.mjs 使用：ClinicList 以 clinic.id 為 key，卡片內的狀態（收藏按鈕的 busy）
	// 要跟著同一間診所走；後端清單有重複 id 時退回索引 key，照舊版（React 只警告）全部渲染、不丟 each_key_duplicate。
	import { setAuth } from "$lib/auth/auth.svelte";
	import ClinicList from "$lib/components/clinics/ClinicList.svelte";
	import type { Clinic } from "$lib/types/clinic";

	// 已登入的民眾（收藏按鈕才會真的呼叫 API、進入 busy）
	const auth = setAuth();
	auth.user = {
		id: "u-member",
		email: "member@example.com",
		is_active: true,
		phone_number: null,
		facility_id: null,
		roles: ["patient"],
		facility: null,
		display_name: "測試會員",
		last_booked_member_patient_id: null,
		created_at: "2026-01-01T00:00:00Z",
		updated_at: null,
	};
	auth.isLoading = false;

	const clinic = (n: number, name: string): Clinic => ({
		id: `00000000-0000-4000-8000-00000000000${n}`,
		clinic_name: name,
		hospital_level: "clinic",
		departments: ["family_medicine"],
		phone: "02-1234-5678",
		address: "臺北市中正區測試路 1 號",
		facility_type: "healthcare",
		payment_type: "nhi",
	});
	const A = clinic(1, "甲診所");
	const B = clinic(2, "乙診所");

	let clinics = $state<Clinic[]>([A, B]);
</script>

<button id="reverse" type="button" onclick={() => (clinics = [...clinics].reverse())}>反轉順序</button>
<button id="duplicate" type="button" onclick={() => (clinics = [A, A, B])}>重複 id</button>
<button id="unique" type="button" onclick={() => (clinics = [B, A])}>恢復不重複</button>
<section id="list"><ClinicList {clinics} /></section>
