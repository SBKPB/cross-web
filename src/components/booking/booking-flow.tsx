"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { StickySubmitButton } from "./sticky-submit-button";

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

  // 未登入 → 先去 /auth 登入，登入完自動回來
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
    }
  }, [authLoading, isAuthenticated, router, pathname]);

  const primaryColor = clinicConfig.primary_color;

  const loadSlots = useCallback(() => {
    if (!selection.service) return;
    setIsLoadingSlots(true);
    setSlotsError(false);
    bookingApi
      .getAvailableSlots(clinicId, selection.service.id, selection.doctor?.id ?? null)
      .then(setAvailableDates)
      .catch((error) => {
        console.error("Failed to load available slots:", error);
        setSlotsError(true);
        setAvailableDates([]);
      })
      .finally(() => setIsLoadingSlots(false));
  }, [clinicId, selection.service, selection.doctor]);

  // 載入可預約時段（loadSlots 已 memoize 於 service / doctor）
  useEffect(() => {
    if (currentStep === 3 && selection.service) {
      loadSlots();
    }
  }, [currentStep, selection.service, loadSlots]);

  // 取得選取日期的時段
  const selectedDateSlots = useMemo(() => {
    if (!selection.date) return [];
    const dateInfo = availableDates.find((d) => d.date === selection.date);
    return dateInfo?.slots || [];
  }, [availableDates, selection.date]);

  // 判斷是否可以進入下一步
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return selection.service !== null;
      case 2:
        return selection.doctor !== null;
      case 3:
        return (
          selection.date !== null &&
          selection.timeSlot !== null &&
          selectedPatient !== null &&
          formData.privacyAccepted
        );
      default:
        return false;
    }
  }, [currentStep, selection, formData, selectedPatient]);

  // 下一步按鈕文字
  const nextButtonLabel = useMemo(() => {
    switch (currentStep) {
      case 1:
        return "選擇人員";
      case 2:
        return "選擇時間";
      case 3:
        return "確認送出預約";
      default:
        return "下一步";
    }
  }, [currentStep]);

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
  }, [canProceed, currentStep, clinicId, selection, formData, selectedPatient, dispatch, router]);

  // 處理返回上一步
  const handleStepClick = useCallback(
    (step: 1 | 2 | 3) => {
      if (step < currentStep) {
        dispatch({ type: "GO_TO_STEP", payload: step });
      }
    },
    [currentStep, dispatch]
  );

  // 未登入或 loading → 顯示 loading（等 redirect 完成）
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-32">
      {/* Clinic Header */}
      <ClinicHeader clinic={clinicConfig} />

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
                選擇看診時間與對象，最後確認送出
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
                    className="rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                    onClick={loadSlots}
                  >
                    重新載入
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <DatePicker
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
                        selectedSlot={selection.timeSlot}
                        onSelectSlot={(slot) =>
                          dispatch({ type: "SET_TIME_SLOT", payload: slot })
                        }
                        primaryColor={primaryColor}
                      />
                    </div>
                  )}
                </div>
              )}
            </BookingSection>

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
