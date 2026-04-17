"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useBooking, useBookingDispatch } from "@/components/booking/booking-context";
import { useAuth } from "@/lib/auth/auth-context";
import { bookingApi } from "@/lib/api/booking";
import type {
  ClinicConfig,
  ServiceOption,
  DoctorOption,
  BookableDate,
} from "@/types/booking";
import type { MemberPatientRead } from "@/types/member-patient";

import { ClinicHeader } from "./clinic-header";
import { BookingStepper } from "./booking-stepper";
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
}

export function BookingFlow({
  clinicId,
  clinicConfig,
  services,
  doctors,
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

  // 載入可預約時段
  useEffect(() => {
    if (currentStep === 3 && selection.service) {
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
    }
  }, [clinicId, currentStep, selection.service, selection.doctor]);

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
    <div className="flex min-h-screen flex-col bg-background pb-28">
      {/* Clinic Header */}
      <ClinicHeader clinic={clinicConfig} />

      {/* Stepper — sticky 在 header 下方 */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <BookingStepper
          currentStep={currentStep}
          onStepClick={handleStepClick}
          primaryColor={primaryColor}
        />
      </div>

      {/* Content */}
      <div className="flex-1 py-6">
        {/* Step 1: Select Service */}
        {currentStep === 1 && (
          <ServiceList
            services={services}
            selectedService={selection.service}
            onSelectService={(service) =>
              dispatch({ type: "SET_SERVICE", payload: service })
            }
            primaryColor={primaryColor}
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

        {/* Step 3: Select Date/Time & Form */}
        {currentStep === 3 && (
          <div className="space-y-8">
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
                  onClick={() => {
                    setSlotsError(false);
                    setIsLoadingSlots(true);
                    if (selection.service) {
                      bookingApi
                        .getAvailableSlots(clinicId, selection.service.id, selection.doctor?.id ?? null)
                        .then(setAvailableDates)
                        .catch(() => setSlotsError(true))
                        .finally(() => setIsLoadingSlots(false));
                    }
                  }}
                >
                  重新載入
                </button>
              </div>
            ) : (
              <>
                <DatePicker
                  dates={availableDates}
                  selectedDate={selection.date}
                  onSelectDate={(date) =>
                    dispatch({ type: "SET_DATE", payload: date })
                  }
                  primaryColor={primaryColor}
                />

                {selection.date && (
                  <TimeSlotGrid
                    slots={selectedDateSlots}
                    selectedSlot={selection.timeSlot}
                    onSelectSlot={(slot) =>
                      dispatch({ type: "SET_TIME_SLOT", payload: slot })
                    }
                    primaryColor={primaryColor}
                  />
                )}
              </>
            )}

            {/* 看診對象選擇 */}
            <div className="border-t border-border/60 px-4 pt-6">
              <PatientSelector
                selectedId={selectedPatient?.id || null}
                onSelect={setSelectedPatient}
              />
            </div>

            {/* 備註 + 隱私同意 */}
            <div className="border-t border-border/60 pt-6">
              <BookingForm primaryColor={primaryColor} />
            </div>

            {submitError && (
              <div className="mx-4 rounded-3xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
      />
    </div>
  );
}
