"use client";

import { NO_PREFERENCE_DOCTOR } from "@/lib/constants/booking-constants";
import type { DoctorOption } from "@/types/booking";

import { DoctorCard } from "./doctor-card";

interface DoctorSelectorProps {
  doctors: DoctorOption[];
  selectedDoctor: DoctorOption | null;
  onSelectDoctor: (doctor: DoctorOption) => void;
  primaryColor?: string;
}

export function DoctorSelector({
  doctors,
  selectedDoctor,
  onSelectDoctor,
  primaryColor,
}: DoctorSelectorProps) {
  const allOptions = [NO_PREFERENCE_DOCTOR, ...doctors];

  return (
    <div className="space-y-7 px-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          選擇看診人員
        </h1>
        <p className="text-sm text-muted-foreground">
          可指定特定人員，或交由系統安排
        </p>
      </div>

      <div className="rounded-3xl bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:p-5">
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex snap-x snap-mandatory gap-2 pb-1">
            {allOptions.map((doctor) => (
              <DoctorCard
                key={doctor.id ?? "no-preference"}
                doctor={doctor}
                isSelected={selectedDoctor?.id === doctor.id}
                onSelect={onSelectDoctor}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
