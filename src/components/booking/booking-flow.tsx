"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { useBooking, useBookingDispatch } from "@/components/booking/booking-context";
import { useAuth } from "@/lib/auth/auth-context";
import { bookingApi } from "@/lib/api/booking";
import type {
  ClinicConfig,
  ServiceOption,
  DoctorOption,
  BookableDate,
} from "@/types/booking";
import type { PaymentType } from "@/types/clinic";
import type { MemberPatientRead } from "@/types/member-patient";

import { ClinicHeader } from "./clinic-header";
import { BookingStepper } from "./booking-stepper";
import { BookingSection } from "./booking-section";
import { ServiceList } from "./service-list";
import { DoctorSelector } from "./doctor-selector";
import { DatePicker } from "./date-picker";
import { TimeSlotGrid } from "./time-slot-grid";
import { BookingForm } from "./booking-form";
import { PatientSelector } from "@/components/patient/patient-selector";
import { inkOn } from "@/lib/color-contrast";
import { StickySubmitButton } from "./sticky-submit-button";
import { availableSlotForSelection, bookingDraftKey, decodeBookingDraft, encodeBookingDraft } from "@/lib/booking-draft";
import { isDemoClinic } from "@/lib/clinic-discovery";

interface BookingFlowProps {
  clinicId: string;
  clinicConfig: ClinicConfig;
  services: ServiceOption[];
  doctors: DoctorOption[];
  /** 院所付款方式（健保 / 自費 / 兩者）；服務的健保 badge 依此 gating */
  paymentType?: PaymentType;
}

export function BookingFlow({
  clinicId,
  clinicConfig,
  services,
  doctors,
  paymentType,
}: BookingFlowProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { selection, formData, currentStep } = useBooking();
  const dispatch = useBookingDispatch();

  const [availableDates, setAvailableDates] = useState<BookableDate[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<MemberPatientRead | null>(null);
  const slotsRequest = useRef(0);
  const isDemo = isDemoClinic(clinicId);

  // 登入後回到原本選取的時段；重新取得名額後才允許送出。
  useEffect(() => {
    try {
      const key = bookingDraftKey(clinicId);
      const draft = decodeBookingDraft(sessionStorage.getItem(key), services, doctors);
      sessionStorage.removeItem(key);
      if (draft) dispatch({ type: "RESTORE_SELECTION", payload: draft });
    } catch { /* 停用瀏覽器儲存時仍可正常選擇及預約。 */ }
  }, [clinicId, services, doctors, dispatch]);

  const primaryColor = clinicConfig.primary_color;

  const loadSlots = useCallback(() => {
    if (!selection.service) return;
    const requestId = ++slotsRequest.current;
    setIsLoadingSlots(true);
    setSlotsError(false);
    bookingApi
      .getAvailableSlots(clinicId, selection.service.id, selection.doctor?.id ?? null)
      .then((dates) => { if (requestId === slotsRequest.current) setAvailableDates(dates); })
      .catch((error) => {
        if (requestId !== slotsRequest.current) return;
        console.error("Failed to load available slots:", error);
        setSlotsError(true);
        setAvailableDates([]);
      })
      .finally(() => { if (requestId === slotsRequest.current) setIsLoadingSlots(false); });
  }, [clinicId, selection.service, selection.doctor]);

  // 載入可預約時段（loadSlots 已 memoize 於 service / doctor）
  useEffect(() => {
    if (currentStep === 3 && selection.service) {
      loadSlots();
    }
    return () => { slotsRequest.current += 1; };
  }, [currentStep, selection.service, loadSlots]);

  // 取得選取日期的時段
  const selectedDateSlots = useMemo(() => {
    if (!selection.date) return [];
    const dateInfo = availableDates.find((d) => d.date === selection.date);
    return dateInfo?.slots || [];
  }, [availableDates, selection.date]);
  const currentSlot = availableSlotForSelection(availableDates, selection);
  const validSlot = Boolean(currentSlot && !isLoadingSlots && !slotsError);

  // 判斷是否可以進入下一步
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return selection.service !== null;
      case 2:
        return selection.doctor !== null;
      case 3:
        return (
          !isDemo && validSlot && !authLoading &&
          (!isAuthenticated || (selectedPatient !== null && formData.privacyAccepted))
        );
      default:
        return false;
    }
  }, [currentStep, selection, formData, selectedPatient, validSlot, authLoading, isAuthenticated, isDemo]);

  // 下一步按鈕文字
  const nextButtonLabel = useMemo(() => {
    switch (currentStep) {
      case 1:
        return "選擇人員";
      case 2:
        return "選擇時間";
      case 3:
        return isDemo ? "示範流程，不會建立預約" : isAuthenticated ? "確認送出預約" : "登入並繼續預約";
      default:
        return "下一步";
    }
  }, [currentStep, isAuthenticated, isDemo]);

  // sticky 按鈕上方的選取摘要提示
  const submitHint = useMemo(() => {
    const parts: string[] = [];
    if (selection.service) parts.push(selection.service.name);
    if (selection.doctor?.name && selection.doctor.id !== null) {
      parts.push(selection.doctor.name);
    }
    if (currentStep === 3 && selection.date && selection.timeSlot) {
      parts.push(`${selection.date} ${selection.timeSlot.time}`);
    }
    return parts.length > 0 ? parts.join("・") : undefined;
  }, [selection, currentStep]);

  // 處理下一步
  const handleNext = useCallback(async () => {
    if (!canProceed) return;

    if (currentStep === 3) {
      if (isDemo || !validSlot) return;
      if (!isAuthenticated) {
        try {
          sessionStorage.setItem(bookingDraftKey(clinicId), encodeBookingDraft(selection));
        } catch { /* 無法暫存時，登入後仍可重新選取時段。 */ }
        router.push(`/auth?next=${encodeURIComponent(pathname)}`);
        return;
      }
      // 送出預約
      if (!selection.service || !selection.date || !selection.timeSlot || !selectedPatient) {
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);
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

        // 導向成功頁
        router.push(`/booking/${clinicId}/success?id=${response.id}&number=${response.booking_number}`);
      } catch (error) {
        console.error("Booking failed:", error);
        setSubmitError("預約失敗，請稍後再試");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      dispatch({ type: "NEXT_STEP" });
    }
  }, [canProceed, currentStep, clinicId, selection, formData, selectedPatient, dispatch, router, isDemo, validSlot, isAuthenticated, pathname]);

  // 處理返回上一步
  const handleStepClick = useCallback(
    (step: 1 | 2 | 3) => {
      if (step < currentStep) {
        dispatch({ type: "GO_TO_STEP", payload: step });
      }
    },
    [currentStep, dispatch]
  );

  return (
    <div className="flex min-h-screen flex-col bg-background pb-32">
      {/* Clinic Header */}
      <ClinicHeader clinic={clinicConfig} />
      <div className="mx-auto mt-5 w-full max-w-2xl px-4">
        <p className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-relaxed">
          {isDemo ? "這是示範院所，可體驗服務與時段選擇，不會建立實際預約。" : "先選服務與時段，確認時再登入。時段以送出預約時的剩餘名額為準。"}
          {isDemo && <Link href="/search" className="ml-2 font-medium text-primary underline">查看合作店家</Link>}
        </p>
      </div>

      {/* Stepper — sticky 在頂部 */}
      <div className="sticky top-0 z-20 mt-6 border-y border-border/60 bg-background/80 backdrop-blur-lg">
        <BookingStepper
          currentStep={currentStep}
          onStepClick={handleStepClick}
          primaryColor={primaryColor}
        />
      </div>

      {/* Content — 置中、桌機固定寬度 */}
      <div className="mx-auto w-full max-w-2xl flex-1 py-6 sm:py-8">
        {/* Step 1: Select Service */}
        {currentStep === 1 && (
          <ServiceList
            services={services}
            selectedService={selection.service}
            onSelectService={(service) =>
              dispatch({ type: "SET_SERVICE", payload: service })
            }
            primaryColor={primaryColor}
            paymentType={paymentType}
          />
        )}

        {/* Step 2: Select Doctor */}
        {currentStep === 2 && (
          <DoctorSelector
            doctors={doctors}
            selectedDoctor={selection.doctor}
            onSelectDoctor={(doctor) =>
              dispatch({ type: "SET_DOCTOR", payload: doctor })
            }
            primaryColor={primaryColor}
          />
        )}

        {/* Step 3: Select Date/Time、看診對象、備註與同意 */}
        {currentStep === 3 && (
          <div className="space-y-5 px-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                確認預約資訊
              </h1>
              <p className="text-sm text-muted-foreground">
                選擇合適的時段，再確認看診對象
              </p>
            </div>

            {/* ① 選日期時間 */}
            <BookingSection
              index={1}
              title="選擇日期與時間"
              primaryColor={primaryColor}
            >
              {isLoadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="size-8 animate-spin rounded-full border-4 border-muted border-t-current"
                    style={{ borderTopColor: primaryColor }}
                  />
                </div>
              ) : slotsError ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    無法載入可預約時段，請稍後再試
                  </p>
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-sm font-medium shadow-sm"
                    style={{
                      backgroundColor: primaryColor,
                      color: inkOn(primaryColor),
                    }}
                    onClick={loadSlots}
                  >
                    重新載入
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <DatePicker
                    key={`${selection.service?.id}-${selection.doctor?.id}`}
                    dates={availableDates}
                    selectedDate={selection.date}
                    onSelectDate={(date) =>
                      dispatch({ type: "SET_DATE", payload: date })
                    }
                    primaryColor={primaryColor}
                  />

                  {selection.date && (
                    <div className="border-t border-border/60 pt-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CalendarClock className="size-4 text-muted-foreground" />
                        選擇時段
                      </div>
                      <TimeSlotGrid
                        slots={selectedDateSlots}
                        selectedSlot={currentSlot ?? null}
                        onSelectSlot={(slot) =>
                          dispatch({ type: "SET_TIME_SLOT", payload: slot })
                        }
                        primaryColor={primaryColor}
                      />
                    </div>
                  )}
                </div>
              )}
              {!isLoadingSlots && !slotsError && selection.timeSlot && !currentSlot && <p className="mt-4 text-sm text-destructive" role="status">原先選取的時段已無法預約，請重新選擇。</p>}
            </BookingSection>

            {isAuthenticated && !isDemo ? <>
            {/* ② 看診對象 */}
            <BookingSection
              index={2}
              title="看診對象"
              description="選擇本次就診的人員"
              primaryColor={primaryColor}
            >
              <PatientSelector
                selectedId={selectedPatient?.id || null}
                onSelect={setSelectedPatient}
              />
            </BookingSection>

            {/* ③ 備註與同意 */}
            <BookingSection
              index={3}
              title="備註與同意"
              primaryColor={primaryColor}
            >
              <BookingForm primaryColor={primaryColor} />
            </BookingSection>

            </> : !isDemo ? <div className="rounded-2xl border bg-card p-5">
              <h2 className="font-semibold">選好時間，再登入完成預約</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">登入後可選擇看診對象與填寫備註。所選服務與時段會暫存 30 分鐘，名額尚未保留。</p>
            </div> : null}

            {submitError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <StickySubmitButton
        label={nextButtonLabel}
        onClick={handleNext}
        disabled={!canProceed}
        isLoading={isSubmitting}
        primaryColor={primaryColor}
        hint={submitHint}
      />
    </div>
  );
}
