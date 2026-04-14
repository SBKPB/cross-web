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
    <div className="flex items-center justify-center gap-1 px-4 py-4">
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
                "flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-all",
                "ring-1 ring-foreground/5",
                isCompleted && "text-white shadow-sm",
                isCurrent && "text-white shadow-md scale-110",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                isClickable && "cursor-pointer hover:opacity-90",
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
                "ml-2 text-sm transition-colors",
                isCurrent
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </span>

            {/* Connector Line */}
            {index < BOOKING_STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-0.5 w-6 rounded-full transition-colors",
                  currentStep > step ? "bg-current" : "bg-muted",
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
