<script lang="ts">
	import ArrowLeft from "@lucide/svelte/icons/arrow-left";
	import CalendarDays from "@lucide/svelte/icons/calendar-days";
	import CheckCircle2 from "@lucide/svelte/icons/circle-check";
	import Clock from "@lucide/svelte/icons/clock";
	import Hash from "@lucide/svelte/icons/hash";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import Stethoscope from "@lucide/svelte/icons/stethoscope";
	import Ticket from "@lucide/svelte/icons/ticket";
	import XCircle from "@lucide/svelte/icons/circle-x";
	import { untrack, type Component } from "svelte";
	import {
		memberAppointmentApi,
		type MemberAppointment,
		type MemberQueueStatus,
	} from "$lib/api/member-appointment";
	import { requireMember } from "$lib/auth/auth.svelte";
	import QueueProgressCard from "$lib/components/member/QueueProgressCard.svelte";
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
	} from "$lib/components/ui/alert-dialog/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Card } from "$lib/components/ui/card/index.js";
	import { APPOINTMENT_STATUS_LABELS, QUEUE_ACTIVE_STATUSES } from "$lib/constants/appointment";
	import { pollOnVisible } from "$lib/hooks/poll-on-visible.svelte";
	import {
		STATUS_HERO,
		STATUS_VARIANT,
		applyQueueStatus,
		formatFullDate,
		formatTime,
		queueFlags,
	} from "$lib/member/appointments";
	import { cn } from "$lib/utils";

	// 移植自舊版 app/member/appointments/[id]/page.tsx（路由頁以 {#key id} 掛載，換 id 時整頁重建，同 Next）
	let { id }: { id: string } = $props();

	const guard = requireMember(() => `/member/appointments/${id}`);

	let appt = $state.raw<MemberAppointment | null>(null);
	let isLoading = $state(true);
	let notFound = $state(false);

	// 叫號進度（院所方案不足時 enabled=false → 隱藏進度卡）
	let queueStatus = $state.raw<MemberQueueStatus | null>(null);

	let cancelOpen = $state(false);
	let isCancelling = $state(false);
	let cancelError = $state<string | null>(null);

	async function fetchAppt() {
		isLoading = true;
		try {
			// 帶最大回溯天數（365），避免超過預設 90 天的舊預約查不到詳情
			const list = await memberAppointmentApi.list(undefined, 365);
			const found = list.find((a) => a.id === id) ?? null;
			appt = found;
			notFound = found === null;
		} catch (err) {
			console.error("Failed to load appointment:", err);
			notFound = true;
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		if (!guard.ready) return;
		untrack(fetchAppt);
	});

	// 拉取叫號進度，並把較新的狀態（已報到 / 看診中…）回寫到預約本體，hero 即時更新
	const fetchQueueStatus = async () => {
		try {
			const qs = await memberAppointmentApi.getQueueStatus(id);
			queueStatus = qs;
			appt = applyQueueStatus(appt, qs);
		} catch {
			// 進度查詢非關鍵資訊，失敗安靜略過（卡片維持上次狀態或不顯示）
		}
	};

	// 進行中的預約載入後先抓一次進度（狀態改變時再抓，同舊版 useEffect [apptStatus]）
	const apptStatus = $derived(appt?.status ?? null);
	$effect(() => {
		if (!apptStatus || !QUEUE_ACTIVE_STATUSES.includes(apptStatus)) return;
		untrack(() => void fetchQueueStatus());
	});

	const flags = $derived(queueFlags(appt, queueStatus));

	// 15 秒輪詢（頁籤可見才打；切回可見立即更新；離開頁面清掉 timer）
	pollOnVisible(() => void fetchQueueStatus(), 15_000, () => flags.shouldPollQueue);

	const handleCancel = async () => {
		if (!appt) return;
		const target = appt;
		isCancelling = true;
		cancelError = null;
		try {
			await memberAppointmentApi.cancel(target.id);
			appt = { ...target, status: "cancelled" };
			cancelOpen = false;
		} catch (err) {
			cancelError = err instanceof Error ? err.message : "取消失敗，請稍後再試";
		} finally {
			isCancelling = false;
		}
	};
</script>

{#snippet infoRow(Icon: Component<{ class?: string }>, label: string, value: string)}
	<div class="flex items-center gap-3 px-5 py-3.5">
		<span class="text-muted-foreground"><Icon class="size-4" /></span>
		<span class="w-20 shrink-0 text-sm text-muted-foreground">{label}</span>
		<span class="min-w-0 flex-1 text-right text-sm font-medium text-foreground">{value}</span>
	</div>
{/snippet}

{#if !guard.ready}
	<div class="flex min-h-[60vh] items-center justify-center bg-background">
		<div class="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
	</div>
{:else}
	<div class="min-h-[60vh] bg-background pb-12">
		<!-- Header -->
		<div class="border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
			<div class="mx-auto flex max-w-4xl items-center gap-3">
				<a href="/member" class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
					<ArrowLeft class="mr-1 size-4" />
					返回
				</a>
				<h1 class="text-lg font-bold text-foreground">預約詳情</h1>
			</div>
		</div>

		<div class="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
			{#if isLoading}
				<div class="flex items-center justify-center py-16">
					<div class="size-6 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
				</div>
			{:else if notFound || !appt}
				<Card class="flex flex-col items-center gap-3 p-12 text-center">
					<XCircle class="size-10 text-muted-foreground" />
					<p class="text-sm text-muted-foreground">找不到這筆預約</p>
					<Button href="/member" size="sm">返回我的預約</Button>
				</Card>
			{:else}
				<!-- 狀態 hero -->
				<div
					class={cn(
						"relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white",
						STATUS_HERO[appt.status],
					)}
				>
					<div class="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-white/10 blur-2xl"></div>
					<div class="relative">
						<Badge variant={STATUS_VARIANT[appt.status]} class="bg-white/20 text-white">
							{APPOINTMENT_STATUS_LABELS[appt.status]}
						</Badge>
						<h2 class="mt-3 flex items-center gap-2 text-2xl font-bold">
							<MapPin class="size-5 shrink-0" />
							<span class="truncate">{appt.facility_name}</span>
						</h2>
						<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
							<span class="flex items-center gap-1.5">
								<CalendarDays class="size-4" />
								{formatFullDate(appt.appointment_date)}
							</span>
							<span class="flex items-center gap-1.5">
								<Clock class="size-4" />
								{formatTime(appt.appointment_time)}
							</span>
						</div>
					</div>
				</div>

				<!-- 叫號進度（今日且進行中、院所有開通叫號功能才顯示） -->
				{#if flags.showQueueCard && queueStatus}
					<QueueProgressCard status={queueStatus} />
				{/if}

				<!-- 詳細資訊 -->
				<Card class="divide-y divide-border/60 p-0">
					{@render infoRow(Hash, "預約編號", appt.booking_number)}
					{#if (appt.queue_number ?? queueStatus?.queue_number) != null}
						{@render infoRow(Ticket, "您的看診號", `${appt.queue_number ?? queueStatus?.queue_number} 號`)}
					{/if}
					{@render infoRow(MapPin, "診所", appt.facility_name)}
					{@render infoRow(CalendarDays, "預約日期", formatFullDate(appt.appointment_date))}
					{@render infoRow(Clock, "預約時間", formatTime(appt.appointment_time))}
					{@render infoRow(Stethoscope, "醫師", appt.staff_name ?? "未指定")}
					{@render infoRow(CheckCircle2, "狀態", APPOINTMENT_STATUS_LABELS[appt.status])}
				</Card>

				<!-- 取消預約（僅 confirmed） -->
				{#if appt.status === "confirmed"}
					<Card class="space-y-3 p-5">
						<p class="text-sm text-muted-foreground">如需更改時間，請先取消此預約再重新預約。</p>
						<Button
							variant="destructive"
							class="w-full"
							onclick={() => {
								cancelError = null;
								cancelOpen = true;
							}}
						>
							<XCircle class="mr-1.5 size-4" />
							取消預約
						</Button>
					</Card>
				{/if}
			{/if}
		</div>

		<!-- 取消確認（Bits 的 Action 不會自動關閉，成功後才由 handleCancel 關閉；同舊版 preventDefault） -->
		<AlertDialog bind:open={cancelOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>確認取消預約</AlertDialogTitle>
					<AlertDialogDescription>
						取消後此時段將釋出，若仍需就診請重新預約。確定要取消嗎？
					</AlertDialogDescription>
				</AlertDialogHeader>
				{#if cancelError}
					<div class="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
						{cancelError}
					</div>
				{/if}
				<AlertDialogFooter class="gap-2 sm:gap-3">
					<AlertDialogCancel disabled={isCancelling}>先不要</AlertDialogCancel>
					<AlertDialogAction
						type="button"
						onclick={(e) => {
							e.preventDefault();
							handleCancel();
						}}
						disabled={isCancelling}
						class="bg-destructive text-white hover:bg-destructive/90"
					>
						{isCancelling ? "取消中..." : "確認取消"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	</div>
{/if}
