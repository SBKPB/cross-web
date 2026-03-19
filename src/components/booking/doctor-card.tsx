"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DoctorOption } from "@/types/booking";

interface DoctorCardProps {
  doctor: DoctorOption;
  isSelected: boolean;
  onSelect: (doctor: DoctorOption) => void;
  primaryColor?: string;
}

export function DoctorCard({
  doctor,
  isSelected,
  onSelect,
  primaryColor = "#3b82f6",
}: DoctorCardProps) {
  const isNoPreference = doctor.id === null;

  return (
    <button
      type="button"
      onClick={() => onSelect(doctor)}
      className={cn(
        "flex w-24 shrink-0 snap-start flex-col items-center rounded-xl p-3 transition-all active:scale-95",
        isSelected && "bg-slate-50"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "relative size-16 overflow-hidden rounded-full border-2 transition-colors",
          isSelected ? "border-current" : "border-transparent"
        )}
        style={{ borderColor: isSelected ? primaryColor : undefined }}
      >
        {doctor.avatar ? (
          <Image
            src={doctor.avatar}
            alt={doctor.name}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className={cn(
              "flex size-full items-center justify-center",
              isNoPreference
                ? "bg-slate-100 text-slate-400"
                : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600"
            )}
          >
            <User className="size-7" />
          </div>
        )}

        {/* Selection Check */}
        {isSelected && (
          <div
            className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Name & Title */}
      <div className="mt-2 text-center">
        <p
          className={cn(
            "text-sm font-medium",
            isSelected ? "text-slate-900" : "text-slate-700"
          )}
        >
          {doctor.name}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{doctor.title}</p>
      </div>
    </button>
  );
}
