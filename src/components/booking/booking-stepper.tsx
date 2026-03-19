"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOOKING_STEPS } from "@/lib/constants/booking-constants";

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
    <div className="flex items-center justify-center gap-2 px-4 py-3">
      {BOOKING_STEPS.map(({ step, label }, index) => {
        const isCompleted = currentStep > step;
        const isCurrent = currentStep === step;
        const isClickable = onStepClick && step < currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Step Circle */}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step as 1 | 2 | 3)}
              disabled={!isClickable}
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-medium transition-all",
                isCompleted && "text-white",
                isCurrent && "text-white shadow-md",
                !isCompleted && !isCurrent && "bg-slate-100 text-slate-400",
                isClickable && "cursor-pointer hover:opacity-80"
              )}
              style={{
                backgroundColor: isCompleted || isCurrent ? primaryColor : undefined,
              }}
            >
              {isCompleted ? <Check className="size-4" /> : step}
            </button>

            {/* Step Label */}
            <span
              className={cn(
                "ml-1.5 text-sm",
                isCurrent ? "font-medium text-slate-900" : "text-slate-500"
              )}
            >
              {label}
            </span>

            {/* Connector Line */}
            {index < BOOKING_STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-8",
                  currentStep > step ? "bg-current" : "bg-slate-200"
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
