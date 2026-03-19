"use client";

import type { DoctorOption } from "@/types/booking";
import { NO_PREFERENCE_DOCTOR } from "@/lib/constants/booking-constants";
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
  // 將「不指定」放在最前面
  const allOptions = [NO_PREFERENCE_DOCTOR, ...doctors];

  return (
    <div className="px-4">
      <h2 className="mb-3 text-sm font-medium text-slate-500">選擇人員</h2>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex snap-x snap-mandatory gap-2 pb-2">
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
  );
}
