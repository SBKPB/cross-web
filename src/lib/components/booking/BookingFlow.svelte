<script lang="ts">
	import { untrack } from "svelte";
	import CalendarClock from "@lucide/svelte/icons/calendar-clock";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { bookingApi } from "#lib/api/booking.ts";
	import { getAuth } from "#lib/auth/auth.svelte.ts";
	import { AvailableSlots } from "#lib/booking/available-slots.svelte.ts";
	import {
		bookingAuthPath,
		bookingSuccessPath,
		canProceed as canProceedFor,
		nextButtonLabel as nextButtonLabelFor,
		restoreBookingDraft,
		saveBookingDraft,
		submitHint as submitHintFor,
	} from "#lib/booking/booking-flow.ts";
	import { availableSlotForSelection } from "#lib/booking-draft.ts";
	import { isDemoClinic } from "#lib/clinic-discovery.ts";
	import { inkOn } from "#lib/color-contrast.ts";
	import PatientSelector from "#lib/components/patient/PatientSelector.svelte";
	import type { ClinicConfig, DoctorOption, ServiceOption } from "#lib/types/booking.ts";
	import type { PaymentType } from "#lib/types/clinic.ts";
	import type { MemberPatientRead } from "#lib/types/member-patient.ts";
	import { setBookingStore } from "./booking-context.svelte";
	import BookingForm from "./BookingForm.svelte";
	import BookingSection from "./BookingSection.svelte";
	import BookingStepper from "./BookingStepper.svelte";
	import ClinicHeader from "./ClinicHeader.svelte";
	import DatePicker from "./DatePicker.svelte";
	import DoctorSelector from "./DoctorSelector.svelte";
	import ServiceList from "./ServiceList.svelte";
	import StickySubmitButton from "./StickySubmitButton.svelte";
	import TimeSlotGrid from "./TimeSlotGrid.svelte";

	// 移植自舊版 components/booking/booking-flow.tsx。本元件即舊版的 <BookingProvider><BookingFlow /></BookingProvider>：
	// 建立預約流程狀態（context），子元件 BookingForm 由 context 取用。
	let {
		clinicId,
		clinicConfig,
		services,
		doctors,
		paymentType,
	}: {
		clinicId: string;
		clinicConfig: ClinicConfig;
		services: ServiceOption[];
		doctors: DoctorOption[];
		/** 院所付款方式（健保 / 自費 / 兩者）；服務的健保 badge 依此 gating */
		paymentType?: PaymentType;
	} = $props();

	const auth = getAuth();
	const store = setBookingStore();

	// 個別欄位以 $derived 取出：reducer 對沒變的欄位保留同一個參照，只有真的換了才觸發下游（同舊版 React 依賴比對）
	const selection = $derived(store.state.selection);
	const formData = $derived(store.state.formData);
	const currentStep = $derived(store.state.currentStep);
	const selectedService = $derived(selection.service);
	const selectedDoctor = $derived(selection.doctor);

	const slots = new AvailableSlots();
	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);

	let selectedPatient = $state.raw<MemberPatientRead | null>(null);
	const isDemo = $derived(isDemoClinic(clinicId));

	const sessionStore = () => sessionStorage;

	// 登入後回到原本選取的時段；重新取得名額後才允許送出。
	$effect(() => {
		const draft = restoreBookingDraft(sessionStore, clinicId, services, doctors);
		if (draft) store.dispatch({ type: "RESTORE_SELECTION", payload: draft });
	});

	const primaryColor = $derived(clinicConfig.primary_color);

	const loadSlots = () => {
		const service = selectedService;
		if (!service) return;
		const doctorId = selectedDoctor?.id ?? null;
		slots.load(() => bookingApi.getAvailableSlots(clinicId, service.id, doctorId));
	};

	// 載入可預約時段：第 3 步且已選服務時。依賴同舊版 useEffect [currentStep, selection.service, loadSlots]
	// （loadSlots 依賴 clinicId、service、doctor）：任一改變即作廢進行中的請求（舊版 effect 清除），再視需要重抓。
	$effect(() => {
		const step = currentStep;
		const service = selectedService;
		void selectedDoctor;
		void clinicId;
		if (step === 3 && service) untrack(loadSlots);
		return () => slots.cancel();
	});

	// 取得選取日期的時段
	const selectedDateSlots = $derived.by(() => {
		if (!selection.date) return [];
		const dateInfo = slots.dates.find((d) => d.date === selection.date);
		return dateInfo?.slots || [];
	});
	const currentSlot = $derived(availableSlotForSelection(slots.dates, selection));
	const validSlot = $derived(Boolean(currentSlot && !slots.isLoading && !slots.error));

	// 判斷是否可以進入下一步
	const canProceed = $derived(
		canProceedFor({
			currentStep,
			selection,
			privacyAccepted: formData.privacyAccepted,
			hasPatient: selectedPatient !== null,
			validSlot,
			authLoading: auth.isLoading,
			isAuthenticated: auth.isAuthenticated,
			isDemo,
		}),
	);

	// 下一步按鈕文字
	const nextButtonLabel = $derived(nextButtonLabelFor(currentStep, auth.isAuthenticated, isDemo));

	// sticky 按鈕上方的選取摘要提示
	const submitHint = $derived(submitHintFor(selection, currentStep));

	// 處理下一步
	const handleNext = async () => {
		if (!canProceed) return;

		if (currentStep === 3) {
			if (isDemo || !validSlot) return;
			if (!auth.isAuthenticated) {
				saveBookingDraft(sessionStore, clinicId, selection);
				goto(bookingAuthPath(page.url.pathname));
				return;
			}
			// 送出預約
			if (!selection.service || !selection.date || !selection.timeSlot || !selectedPatient) {
				return;
			}

			isSubmitting = true;
			submitError = null;
			try {
				const response = await bookingApi.createBooking({
					clinic_id: clinicId,
					member_patient_id: selectedPatient.id,
					service_id: selection.service.id,
					doctor_id: selection.doctor?.id ?? null,
					appointment_date: selection.date,
					appointment_time: selection.timeSlot.time,
					notes: formData.notes || undefined,
				});

				// 導向成功頁（舊版 router.push 不等待導航完成，送出鈕隨即恢復）
				goto(bookingSuccessPath(clinicId, response.id, response.booking_number));
			} catch (error) {
				console.error("Booking failed:", error);
				submitError = "預約失敗，請稍後再試";
			} finally {
				isSubmitting = false;
			}
		} else {
			store.dispatch({ type: "NEXT_STEP" });
		}
	};

	// 處理返回上一步
	const handleStepClick = (step: 1 | 2 | 3) => {
		if (step < currentStep) {
			store.dispatch({ type: "GO_TO_STEP", payload: step });
		}
	};
</script>

<div class="flex min-h-[75vh] flex-col bg-background pb-32">
	<!-- Clinic Header -->
	<ClinicHeader clinic={clinicConfig} />
	<div class="mx-auto mt-5 w-full max-w-2xl px-4">
		<p class="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-relaxed">
			{isDemo
				? "這是示範院所，可體驗服務與時段選擇，不會建立實際預約。"
				: "先選服務與時段，確認時再登入。時段以送出預約時的剩餘名額為準。"}{#if isDemo}<a
					href="/search"
					class="ml-2 font-medium text-primary underline">查看合作店家</a
				>{/if}
		</p>
	</div>

	<!-- Stepper — sticky 在頂部 -->
	<div class="sticky top-16 z-20 sm:top-20 mt-6 border-y border-border/60 bg-background/80 backdrop-blur-lg">
		<BookingStepper {currentStep} onStepClick={handleStepClick} {primaryColor} />
	</div>

	<!-- Content — 置中、桌機固定寬度 -->
	<div class="mx-auto w-full max-w-2xl flex-1 py-6 sm:py-8">
		<!-- Step 1: Select Service -->
		{#if currentStep === 1}
			<ServiceList
				{services}
				selectedService={selection.service}
				onSelectService={(service) => store.dispatch({ type: "SET_SERVICE", payload: service })}
				{primaryColor}
				{paymentType}
			/>
		{/if}

		<!-- Step 2: Select Doctor -->
		{#if currentStep === 2}
			<DoctorSelector
				{doctors}
				selectedDoctor={selection.doctor}
				onSelectDoctor={(doctor) => store.dispatch({ type: "SET_DOCTOR", payload: doctor })}
				{primaryColor}
			/>
		{/if}

		<!-- Step 3: Select Date/Time、看診對象、備註與同意 -->
		{#if currentStep === 3}
			<div class="space-y-5 px-4">
				<div class="space-y-1">
					<h2 class="text-2xl font-semibold tracking-tight text-foreground">確認預約資訊</h2>
					<p class="text-sm text-muted-foreground">選擇合適的時段，再確認看診對象</p>
				</div>

				<!-- ① 選日期時間 -->
				<BookingSection index={1} title="選擇日期與時間" {primaryColor}>
					{#if slots.isLoading}
						<div class="flex items-center justify-center py-12">
							<div
								class="size-8 animate-spin rounded-full border-4 border-muted border-t-current"
								style:border-top-color={primaryColor}
							></div>
						</div>
					{:else if slots.error}
						<div class="flex flex-col items-center gap-3 py-12 text-center">
							<p class="text-sm text-muted-foreground">無法載入可預約時段，請稍後再試</p>
							<button
								type="button"
								class="rounded-full px-5 py-2 text-sm font-medium shadow-sm"
								style:background-color={primaryColor}
								style:color={inkOn(primaryColor)}
								onclick={loadSlots}
							>
								重新載入
							</button>
						</div>
					{:else}
						<div class="space-y-6">
							<!-- 換服務／人員時重掛載，月份回到第一個（舊版 key={service-doctor}） -->
							{#key `${selection.service?.id}-${selection.doctor?.id}`}
								<DatePicker
									dates={slots.dates}
									selectedDate={selection.date}
									onSelectDate={(date) => store.dispatch({ type: "SET_DATE", payload: date })}
									{primaryColor}
								/>
							{/key}

							{#if selection.date}
								<div class="border-t border-border/60 pt-5">
									<div class="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
										<CalendarClock class="size-4 text-muted-foreground" />
										選擇時段
									</div>
									<TimeSlotGrid
										slots={selectedDateSlots}
										selectedSlot={currentSlot ?? null}
										onSelectSlot={(slot) => store.dispatch({ type: "SET_TIME_SLOT", payload: slot })}
										{primaryColor}
									/>
								</div>
							{/if}
						</div>
					{/if}
					{#if !slots.isLoading && !slots.error && selection.timeSlot && !currentSlot}
						<p class="mt-4 text-sm text-destructive" role="status">原先選取的時段已無法預約，請重新選擇。</p>
					{/if}
				</BookingSection>

				{#if auth.isAuthenticated && !isDemo}
					<!-- ② 看診對象 -->
					<BookingSection index={2} title="看診對象" description="選擇本次就診的人員" {primaryColor}>
						<PatientSelector selectedId={selectedPatient?.id || null} onSelect={(p) => (selectedPatient = p)} />
					</BookingSection>

					<!-- ③ 備註與同意 -->
					<BookingSection index={3} title="備註與同意" {primaryColor}>
						<BookingForm {primaryColor} />
					</BookingSection>
				{:else if !isDemo}
					<div class="rounded-2xl border bg-card p-5">
						<h2 class="font-semibold">選好時間，再登入完成預約</h2>
						<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
							登入後可選擇看診對象與填寫備註。所選服務與時段會暫存 30 分鐘，名額尚未保留。
						</p>
					</div>
				{/if}

				{#if submitError}
					<div class="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{submitError}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Submit Button -->
	<StickySubmitButton
		label={nextButtonLabel}
		onClick={handleNext}
		disabled={!canProceed}
		isLoading={isSubmitting}
		{primaryColor}
		hint={submitHint}
	/>
</div>
