<script lang="ts">
	// 只供 tests/duplicate-keys.test.mjs 使用：後端陣列含重複 id / code / 星期時，各元件要照舊版（React 只警告）全部渲染，
	// 不能因 Svelte keyed each 的 each_key_duplicate 整頁壞掉。資料刻意每種陣列都重複一次。
	import { setAuth } from "$lib/auth/auth.svelte";
	import ClinicCard from "$lib/components/clinics/ClinicCard.svelte";
	import ClinicDetailDialog from "$lib/components/clinics/ClinicDetailDialog.svelte";
	import ClinicList from "$lib/components/clinics/ClinicList.svelte";
	import AnnouncementsSection from "$lib/components/clinic-detail/AnnouncementsSection.svelte";
	import BusinessHoursSection from "$lib/components/clinic-detail/BusinessHoursSection.svelte";
	import ClinicDetailHeader from "$lib/components/clinic-detail/ClinicDetailHeader.svelte";
	import DepartmentBadges from "$lib/components/clinic-detail/DepartmentBadges.svelte";
	import DoctorDetailDialog from "$lib/components/clinic-detail/DoctorDetailDialog.svelte";
	import DoctorTeamSection from "$lib/components/clinic-detail/DoctorTeamSection.svelte";
	import ScheduleTimetable from "$lib/components/clinic-detail/ScheduleTimetable.svelte";
	import ServicePreviewList from "$lib/components/clinic-detail/ServicePreviewList.svelte";
	import LandingClinicGrid from "$lib/components/seo/LandingClinicGrid.svelte";
	import { FALLBACK_TAXONOMY } from "$lib/api/service-categories";
	import type { LandingClinic } from "$lib/seo/landing-data";
	import type { AnnouncementPublic, Clinic, ClinicDoctorDetail, Member, Service } from "$lib/types/clinic";
	import type { ScheduleEntry, WeeklySchedule } from "$lib/types/schedule";

	setAuth();

	const member: Member = { id: "m-dup", name: "重複醫師", role: "doctor", title: "醫師", specialties: ["專長甲", "專長甲"] };
	const service: Service = { id: "s-dup", name: "重複服務", description: "", price: 500, duration_minutes: 30, category: "一般服務" };
	const clinic: Clinic = {
		id: "00000000-0000-4000-8000-00000000dup1",
		clinic_name: "重複資料診所",
		hospital_level: "clinic",
		departments: ["family_medicine", "family_medicine", "pediatrics"],
		phone: "02-1234-5678",
		address: "臺北市中正區測試路 1 號",
		facility_type: "healthcare",
		payment_type: "nhi",
		members: [member, member],
		services: [service, service],
		business_hours: [
			{ day: "週一", open: "09:00", close: "12:00", is_closed: false },
			{ day: "週一", open: "09:00", close: "12:00", is_closed: false },
		],
	};

	const announcement: AnnouncementPublic = { id: "a-dup", title: "重複公告", content: "內容", created_at: "2026-06-07T04:00:00Z" };
	const detail: ClinicDoctorDetail = {
		id: "m-dup",
		name: "重複醫師",
		role: "doctor",
		specialties: ["專長乙", "專長乙"],
		education: ["重複學歷", "重複學歷"],
		experience: ["重複經歷", "重複經歷"],
	};
	const entry: ScheduleEntry = {
		date: "2026-10-19",
		weekday: 0,
		session: "morning",
		start_time: "09:00",
		end_time: "12:00",
		doctor_id: "m-dup",
		doctor_name: "重複醫師",
		department: "家醫科",
	};
	// 同一格同一位醫師重複兩筆（元件依 doctor_id 去重只顯示一次）
	const schedule: WeeklySchedule = { week_start: "2026-10-19", week_end: "2026-10-25", week_offset: 0, entries: [entry, entry] };
	const landing: LandingClinic = {
		id: "l-dup",
		name: "重複落地診所",
		address: null,
		city: null,
		departments: ["pediatrics", "pediatrics"],
		logo: null,
		phone: null,
		is_featured: false,
	};
</script>

<section id="card"><ClinicCard {clinic} /></section>
<section id="list"><ClinicList clinics={[clinic, clinic]} /></section>
<ClinicDetailDialog {clinic} open={true} />

<section id="header"><ClinicDetailHeader {clinic} /></section>
<section id="announcements"><AnnouncementsSection announcements={[announcement, announcement]} /></section>
<section id="departments"><DepartmentBadges departments={clinic.departments} facilityType="healthcare" /></section>
<section id="hours"><BusinessHoursSection businessHours={clinic.business_hours ?? []} /></section>
<section id="services"><ServicePreviewList services={[service, service]} paymentType="nhi" /></section>
<section id="team"><DoctorTeamSection members={[member, member]} details={[detail, detail]} /></section>
<section id="schedule"><ScheduleTimetable {schedule} /></section>
<section id="landing"><LandingClinicGrid clinics={[landing, landing]} taxonomy={FALLBACK_TAXONOMY} /></section>
<DoctorDetailDialog open={true} {member} {detail} />

<!-- 角色分頁（舊版 ROLE_GROUPS）：超過兩個分頁才顯示，點選後只列該組成員 -->
<section id="team-roles">
	<DoctorTeamSection
		members={[
			member,
			{ id: "n1", name: "護理甲", role: "nurse" },
			{ id: "r1", name: "櫃台乙", role: "receptionist" },
			{ id: "t1", name: "治療丙", role: "therapist" },
		]}
	/>
</section>
