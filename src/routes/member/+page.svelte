<script lang="ts">
	import CalendarCheck2 from "@lucide/svelte/icons/calendar-check-2";
	import CalendarDays from "@lucide/svelte/icons/calendar-days";
	import CalendarPlus from "@lucide/svelte/icons/calendar-plus";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import Clock from "@lucide/svelte/icons/clock";
	import Heart from "@lucide/svelte/icons/heart";
	import LogOut from "@lucide/svelte/icons/log-out";
	import Mail from "@lucide/svelte/icons/mail";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import Pencil from "@lucide/svelte/icons/pencil";
	import Phone from "@lucide/svelte/icons/phone";
	import Stethoscope from "@lucide/svelte/icons/stethoscope";
	import Trash2 from "@lucide/svelte/icons/trash-2";
	import Users from "@lucide/svelte/icons/users";
	import { untrack, type Component } from "svelte";
	import { memberApi } from "#lib/api/member.ts";
	import { memberAppointmentApi, type MemberAppointment } from "#lib/api/member-appointment.ts";
	import { memberPatientApi } from "#lib/api/member-patient.ts";
	import { getAuth, requireMember } from "#lib/auth/auth.svelte.ts";
	import EditProfileDialog from "#lib/components/member/EditProfileDialog.svelte";
	import RecentlyViewedRail from "#lib/components/member/RecentlyViewedRail.svelte";
	import ThemeToggle from "#lib/components/ThemeToggle.svelte";
	import {
		AlertDialog,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
	} from "#lib/components/ui/alert-dialog/index.js";
	import { Avatar, AvatarFallback } from "#lib/components/ui/avatar/index.js";
	import { Badge } from "#lib/components/ui/badge/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Card } from "#lib/components/ui/card/index.js";
	import { Skeleton } from "#lib/components/ui/skeleton/index.js";
	import { Tabs, TabsContent, TabsList, TabsTrigger } from "#lib/components/ui/tabs/index.js";
	import { APPOINTMENT_STATUS_LABELS, QUEUE_ACTIVE_STATUSES } from "#lib/constants/appointment.ts";
	import {
		STATUS_VARIANT,
		formatMemberSince,
		formatMonthDay,
		formatTime,
		formatWeekday,
		getInitials,
		groupMemberAppointments,
		memberDisplayName,
	} from "#lib/member/appointments.ts";

	// 移植自舊版 app/member/page.tsx
	const auth = getAuth();
	// 守衛：未登入導向登入頁，後台帳號（管理員 / 院所）導回後台，不渲染民眾端內容
	const guard = requireMember(() => "/member");

	let appointments = $state.raw<MemberAppointment[]>([]);
	let patientCount = $state<number | null>(null);
	let isLoading = $state(true);
	let editProfileOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let isDeletingAccount = $state(false);
	let deleteAccountError = $state("");

	let appointmentsError = $state("");
	let patientsError = $state("");
	let appointmentsLoaded = $state(false);
	let updatedAt = $state("");
	async function fetchData() {
		isLoading = true;
		const [appts, patients] = await Promise.allSettled([
			memberAppointmentApi.list(), memberPatientApi.list(),
		]);
		if (appts.status === "fulfilled") {
			appointments = appts.value;
			appointmentsLoaded = true;
			appointmentsError = "";
			updatedAt = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit" }).format(new Date());
		} else appointmentsError = "暫時無法取得預約紀錄，請重試確認。";
		if (patients.status === "fulfilled") {
			patientCount = patients.value.length;
			patientsError = "";
		} else patientsError = "暫時無法取得預約對象資料。";
		isLoading = false;
	}

	$effect(() => {
		if (!guard.ready) return;
		untrack(fetchData);
	});

	const groups = $derived(groupMemberAppointments(appointments));

	// 確認刪除帳號：成功後沿用登出邏輯清除登入狀態並導回首頁
	const handleDeleteAccount = async () => {
		isDeletingAccount = true;
		deleteAccountError = "";
		try {
			await memberApi.deleteAccount();
			deleteDialogOpen = false;
			auth.logout("/");
		} catch (err) {
			console.error("Failed to delete account:", err);
			deleteAccountError = "刪除失敗，請稍後再試";
		} finally {
			isDeletingAccount = false;
		}
	};

	const displayName = $derived(memberDisplayName(auth.user));
</script>

{#snippet statCard(Icon: Component<{ class?: string }>, label: string, value: number | null, failed = false)}
	<Card class="flex flex-col items-center gap-1 p-3 text-center shadow-sm">
		<span class="text-primary"><Icon class="size-4" /></span>
		{#if failed}<span class="text-2xl font-bold">—<span class="sr-only">尚未取得資料</span></span>{:else if value === null}
			<Skeleton class="h-6 w-6" />
		{:else}
			<span class="text-2xl font-bold text-foreground tabular-nums">{value}</span>
		{/if}
		<span class="text-xs text-muted-foreground">{label}</span>
	</Card>
{/snippet}

{#snippet actionCard(href: string, Icon: Component<{ class?: string }>, title: string, desc: string, accent = false)}
	<a {href}>
		<Card
			class="group flex flex-row items-center gap-3 p-4 text-left transition-colors hover:bg-accent/40 hover:ring-primary/30"
		>
			<span
				class={accent
					? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
					: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"}
			>
				<Icon class="size-5" />
			</span>
			<div class="min-w-0 flex-1">
				<div class="font-medium text-foreground">{title}</div>
				<div class="truncate text-xs text-muted-foreground">{desc}</div>
			</div>
			<ChevronRight
				class="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
			/>
		</Card>
	</a>
{/snippet}

{#snippet emptyState(text: string, showCta: boolean)}
	<Card class="flex flex-col items-center gap-3 p-10 text-center">
		<span class="text-muted-foreground"><CalendarDays class="size-10" /></span>
		<p class="text-sm text-muted-foreground">{text}</p>
		{#if showCta}<Button href="/search" size="sm">立即預約</Button>{/if}
	</Card>
{/snippet}

{#snippet appointmentCard(appt: MemberAppointment, highlight: boolean)}
	<a href="/member/appointments/{appt.id}" class="block">
		<Card class="group overflow-hidden p-0 transition-shadow hover:shadow-md">
			<div class="flex items-stretch">
				<!-- 日期區塊 -->
				<div
					class={highlight
						? "flex w-20 shrink-0 flex-col items-center justify-center bg-primary py-4 text-primary-foreground"
						: "flex w-20 shrink-0 flex-col items-center justify-center bg-muted py-4 text-muted-foreground"}
				>
					<div class="text-lg leading-none font-bold">{formatMonthDay(appt.appointment_date)}</div>
					<div class="mt-1 text-[11px] opacity-80">{formatWeekday(appt.appointment_date)}</div>
					<div class="mt-1.5 flex items-center gap-0.5 text-xs font-medium">
						<Clock class="size-3" />
						{formatTime(appt.appointment_time)}
					</div>
				</div>

				<!-- 內容 -->
				<div class="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
					<div class="flex items-start justify-between gap-2">
						<div class="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
							<MapPin class="size-3.5 shrink-0 text-muted-foreground" />
							<span class="truncate">{appt.facility_name}</span>
						</div>
						<Badge variant={STATUS_VARIANT[appt.status]} class="shrink-0">
							{APPOINTMENT_STATUS_LABELS[appt.status]}
						</Badge>
					</div>
					{#if appt.staff_name}
						<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
							<Stethoscope class="size-3.5 shrink-0" />
							{appt.staff_name}
						</div>
					{/if}
					<div class="flex items-center justify-between gap-2">
						<div class="text-xs text-muted-foreground">預約編號 {appt.booking_number}</div>
						<ChevronRight
							class="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
						/>
					</div>
				</div>
			</div>
		</Card>
	</a>
{/snippet}

<!-- 依分頁渲染一組預約卡片，空時顯示空狀態 -->
{#snippet appointmentGroup(items: MemberAppointment[], emptyText: string, showEmptyCta = false, highlight = false)}
	{#if items.length === 0}
		{@render emptyState(emptyText, showEmptyCta)}
	{:else}
		<div class="space-y-3">
			{#each items as appt, i (`${appt.id}-${i}`)}
				{@render appointmentCard(appt, highlight && QUEUE_ACTIVE_STATUSES.includes(appt.status))}
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet appointmentSkeleton()}
	<Card class="overflow-hidden p-0">
		<div class="flex items-stretch">
			<Skeleton class="h-[88px] w-20 rounded-none" />
			<div class="flex flex-1 flex-col justify-center gap-2 p-4">
				<Skeleton class="h-4 w-2/3" />
				<Skeleton class="h-3 w-1/3" />
				<Skeleton class="h-3 w-1/2" />
			</div>
		</div>
	</Card>
{/snippet}

{#snippet tabCount(count: number)}
	{#if count > 0}<span class="ml-1 text-xs opacity-70">({count})</span>{/if}
{/snippet}

{#if !guard.ready}
	<div class="flex min-h-[60vh] items-center justify-center bg-background">
		<div class="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
	</div>
{:else}
	<div class="min-h-[60vh] bg-background pb-12">
		<div class="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
			<!-- 預約紀錄 -->
			<div>
				<div class="mb-3 flex flex-wrap items-center justify-between gap-3"><h1 class="text-xl font-semibold text-foreground">我的預約</h1><Button href="/search" size="sm" class="min-h-11">預約服務</Button></div>
                {#if appointmentsError}<div role="alert" class="mb-4 space-y-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4"><p>{appointmentsError}</p>{#if appointmentsLoaded}<p class="text-sm text-muted-foreground">以下保留上次資料，最後更新 {updatedAt}（臺北時間）。</p>{/if}<Button variant="outline" disabled={isLoading} onclick={fetchData}>重新載入預約</Button></div>{/if}

				{#if isLoading}
					<div class="space-y-3">
						{@render appointmentSkeleton()}
						{@render appointmentSkeleton()}
					</div>
				{:else if appointmentsLoaded}
					<Tabs value="confirmed">
						<TabsList class="w-full">
							<TabsTrigger value="all">全部{@render tabCount(groups.all.length)}</TabsTrigger>
							<TabsTrigger value="confirmed">已預約{@render tabCount(groups.confirmed.length)}</TabsTrigger>
							<TabsTrigger value="completed">已完成{@render tabCount(groups.completed.length)}</TabsTrigger>
							<TabsTrigger value="cancelled">已取消{@render tabCount(groups.cancelled.length)}</TabsTrigger>
						</TabsList>

						<TabsContent value="all" class="mt-4">
							{@render appointmentGroup(groups.all, "尚無預約紀錄", true)}
						</TabsContent>
						<TabsContent value="confirmed" class="mt-4">
							{@render appointmentGroup(groups.confirmed, "目前沒有即將到來的預約", true, true)}
						</TabsContent>
						<TabsContent value="completed" class="mt-4">
							{@render appointmentGroup(groups.completed, "尚無已完成的預約")}
						</TabsContent>
						<TabsContent value="cancelled" class="mt-4">
							{@render appointmentGroup(groups.cancelled, "尚無已取消的預約")}
						</TabsContent>
					</Tabs>
				{/if}
			</div>

			<!-- Profile 卡 -->
			<div class="relative overflow-hidden rounded-3xl bg-[#163b85] p-6 text-primary-foreground">
				<!-- 裝飾光暈 -->
				<div class="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-white/10 blur-2xl"></div>
				<div class="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-white/5 blur-2xl"></div>

				<div class="relative flex items-start gap-4">
					<Avatar class="size-16 shrink-0 ring-2 ring-white/40">
						<AvatarFallback class="bg-white/20 text-xl font-semibold text-white backdrop-blur">
							{getInitials(displayName)}
						</AvatarFallback>
					</Avatar>

					<div class="min-w-0 flex-1 pt-1">
						<h2 class="truncate text-xl font-bold">{displayName}</h2>
						<div class="mt-1.5 space-y-1 text-sm text-white/80">
							{#if auth.user?.email}
								<div class="flex items-center gap-1.5">
									<Mail class="size-3.5 shrink-0" />
									<span class="truncate">{auth.user.email}</span>
								</div>
							{/if}
							{#if auth.user?.phone_number}
								<div class="flex items-center gap-1.5">
									<Phone class="size-3.5 shrink-0" />
									<span>{auth.user.phone_number}</span>
								</div>
							{/if}
						</div>
						{#if auth.user?.created_at}
							<p class="mt-1.5 text-xs text-white/60">會員自 {formatMemberSince(auth.user.created_at)}</p>
						{/if}
					</div>

					<div class="flex shrink-0 items-center gap-1">
						<Button
							variant="ghost"
							size="icon-sm"
							class="text-white/80 hover:bg-white/15 hover:text-white"
							onclick={() => (editProfileOpen = true)}
							title="編輯個人資料"
						>
							<Pencil class="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							class="text-white/80 hover:bg-white/15 hover:text-white"
							onclick={() => auth.logout("/")}
							title="登出"
						>
							<LogOut class="size-4" />
						</Button>
					</div>
				</div>
			</div>

			<!-- 統計卡 -->
			<div class="grid grid-cols-3 gap-3">
				{@render statCard(Clock, "即將預約", isLoading ? null : groups.confirmed.length, !!appointmentsError && !appointmentsLoaded)}
				{@render statCard(CalendarCheck2, "已完成", isLoading ? null : groups.completed.length, !!appointmentsError && !appointmentsLoaded)}
				{@render statCard(Users, "預約對象", isLoading ? null : patientCount, !!patientsError)}
			</div>

			{#if patientsError}<div role="alert" class="space-y-2 rounded-xl border p-4 text-sm"><p>{patientsError}{patientCount !== null ? " 數量保留上次結果。" : ""}</p><Button variant="outline" size="sm" disabled={isLoading} onclick={fetchData}>重試預約對象資料</Button></div>{/if}
            <!-- 快捷功能 -->
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{@render actionCard("/search", CalendarPlus, "預約服務", "尋找院所、諮詢與療程", true)}
				{@render actionCard("/member/patients", Users, "預約對象管理", "管理家人與本人資料")}
				{@render actionCard("/member/favorites", Heart, "我的收藏", "收藏的診所一覽")}
			</div>

			<!-- 外觀設定（主題切換：亮 / 暗 / 跟隨系統） -->
			<Card class="flex flex-row items-center justify-between gap-3 p-4">
				<div class="min-w-0">
					<div class="font-medium text-foreground">外觀主題</div>
					<div class="text-xs text-muted-foreground">切換亮色、暗色或跟隨系統</div>
				</div>
				<ThemeToggle class="shrink-0" />
			</Card>

			<!-- 最近瀏覽 -->
			<RecentlyViewedRail ready={guard.ready} />


			<!-- 帳號（危險操作） -->
			<Card class="flex flex-row items-center justify-between gap-3 p-4">
				<div class="min-w-0">
					<div class="font-medium text-foreground">刪除帳號</div>
					<div class="text-xs text-muted-foreground">永久刪除會員資料、看診人與預約紀錄</div>
				</div>
				<Button
					variant="destructive"
					size="sm"
					class="shrink-0"
					onclick={() => {
						deleteAccountError = "";
						deleteDialogOpen = true;
					}}
				>
					<Trash2 class="size-4" />
					刪除帳號
				</Button>
			</Card>
		</div>

		<!-- 編輯個人資料：成功後刷新 auth user，名稱 / 手機即時同步到畫面 -->
		<EditProfileDialog
			open={editProfileOpen}
			onOpenChange={(o) => (editProfileOpen = o)}
			user={auth.user}
			onSaved={auth.refreshUser}
		/>

		<!-- 刪除帳號確認（刪除中不允許關閉） -->
		<AlertDialog
			bind:open={
				() => deleteDialogOpen,
				(o) => {
					if (!isDeletingAccount) deleteDialogOpen = o;
				}
			}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>確定要刪除帳號嗎？</AlertDialogTitle>
					<AlertDialogDescription>
						將永久刪除您的會員資料、所有看診人與預約紀錄，此操作無法復原。
					</AlertDialogDescription>
				</AlertDialogHeader>
				{#if deleteAccountError}
					<p class="text-sm text-destructive">{deleteAccountError}</p>
				{/if}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeletingAccount}>取消</AlertDialogCancel>
					<Button variant="destructive" onclick={handleDeleteAccount} disabled={isDeletingAccount}>
						{isDeletingAccount ? "刪除中..." : "刪除帳號"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	</div>
{/if}
