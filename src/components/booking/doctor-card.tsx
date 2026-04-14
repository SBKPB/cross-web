"use client";

import Image from "next/image";
import { Check, User } from "lucide-react";

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
  return (
    <button
      type="button"
      onClick={() => onSelect(doctor)}
      className={cn(
        "flex w-28 shrink-0 snap-start flex-col items-center rounded-3xl p-3 transition-all",
        isSelected ? "bg-card shadow-md ring-1 ring-foreground/5" : "hover:bg-card/60",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "relative size-16 overflow-hidden rounded-full transition-all",
        )}
        style={{
          boxShadow: isSelected ? `0 0 0 3px ${primaryColor}` : undefined,
        }}
      >
        {doctor.avatar ? (
          <Image
            src={doctor.avatar}
            alt={doctor.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
            <User className="size-7" />
          </div>
        )}

        {/* Selection Check */}
        {isSelected && (
          <div
            className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full text-white ring-2 ring-background"
            style={{ backgroundColor: primaryColor }}
          >
            <Check className="size-3" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Name & Title */}
      <div className="mt-2.5 text-center">
        <p
          className={cn(
            "text-sm font-medium",
            isSelected ? "text-foreground" : "text-foreground/80",
          )}
        >
          {doctor.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{doctor.title}</p>
      </div>
    </button>
  );
}
