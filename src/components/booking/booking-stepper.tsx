"use client";

import { Check } from "lucide-react";

import { BOOKING_STEPS } from "@/lib/constants/booking-constants";
import { cn } from "@/lib/utils";

interface BookingStepperProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  primaryColor?: string;
}

export function BookingStepper({
  currentStep,
  onStepClick,
  primaryColor = "#3b82f6",
}: BookingStepperProps) {
  return (
    <div className="mx-auto flex max-w-2xl items-center justify-center gap-1 px-4 py-3.5 sm:gap-2">
      {BOOKING_STEPS.map(({ step, label }, index) => {
        const isCompleted = currentStep > step;
        const isCurrent = currentStep === step;
        const isClickable = onStepClick && step < currentStep;
        const isActive = isCompleted || isCurrent;

        return (
          <div key={step} className="flex items-center">
            {/* Step Circle */}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step as 1 | 2 | 3)}
              disabled={!isClickable}
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                "ring-1 ring-foreground/5",
                isCompleted && "text-white shadow-sm",
                isCurrent && "text-white shadow-md ring-2 ring-offset-2 ring-offset-background",
                !isActive && "bg-muted text-muted-foreground",
                isClickable && "cursor-pointer hover:opacity-90",
              )}
              style={{
                backgroundColor: isActive ? primaryColor : undefined,
                ...(isCurrent ? { "--tw-ring-color": primaryColor } : {}),
              }}
            >
              {isCompleted ? <Check className="size-4" strokeWidth={3} /> : step}
            </button>

            {/* Step Label — 手機只顯示目前步驟 label，桌機全顯示 */}
            <span
              className={cn(
                "ml-2 text-sm transition-colors",
                isCurrent
                  ? "font-semibold text-foreground"
                  : "hidden text-muted-foreground sm:inline",
              )}
            >
              {label}
            </span>

            {/* Connector Line */}
            {index < BOOKING_STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2.5 h-0.5 w-5 rounded-full transition-colors sm:w-8",
                  currentStep > step ? "" : "bg-muted",
                )}
                style={{
                  backgroundColor: currentStep > step ? primaryColor : undefined,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
