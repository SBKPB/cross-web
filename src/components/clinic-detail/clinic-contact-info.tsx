"use client";

import { Clock, MapPin, Navigation, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Clinic } from "@/types/clinic";

interface ClinicContactInfoProps {
  clinic: Clinic;
  className?: string;
}

export function ClinicContactInfo({ clinic, className }: ClinicContactInfoProps) {
  const getTodayHours = () => {
    if (!clinic.business_hours || clinic.business_hours.length === 0) return null;
    const today = new Date().getDay();
    const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
    const todayName = dayNames[today];
    return clinic.business_hours.find((h) => h.day === todayName);
  };

  const todayHours = getTodayHours();

  const actionTileClass = cn(
    "group/tile flex flex-1 flex-col items-center gap-1.5 rounded-3xl bg-card px-3 py-4",
    "shadow-sm ring-1 ring-foreground/5",
    "transition-all hover:-translate-y-0.5 hover:shadow-md",
  );

  const iconCircleClass = "flex size-11 items-center justify-center rounded-full transition-colors";

  return (
    <div className={cn("px-4 sm:px-6", className)}>
      {/* Quick action row */}
      <div className="flex items-stretch justify-center gap-3 sm:gap-4">
        {clinic.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={actionTileClass}
          >
            <div className={cn(iconCircleClass, "bg-accent text-accent-foreground")}>
              <Navigation className="size-4.5" />
            </div>
            <span className="text-xs font-medium text-foreground">導航</span>
          </a>
        )}

        {clinic.phone && (
          <a href={`tel:${clinic.phone}`} className={actionTileClass}>
            <div className={cn(iconCircleClass, "bg-sky-100 text-sky-600")}>
              <Phone className="size-4.5" />
            </div>
            <span className="text-xs font-medium text-foreground">電話</span>
          </a>
        )}

        {todayHours && (
          <div className={cn(actionTileClass, "hover:translate-y-0 hover:shadow-sm")}>
            <div className={cn(iconCircleClass, "bg-amber-100 text-amber-600")}>
              <Clock className="size-4.5" />
            </div>
            <span className="text-xs font-medium text-foreground">
              {todayHours.is_closed
                ? "今日休息"
                : `${todayHours.open}-${todayHours.close}`}
            </span>
          </div>
        )}
      </div>

      {/* 地址列 */}
      {clinic.address && (
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-2.5 rounded-3xl bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/5 transition-all hover:shadow-md"
        >
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-foreground">{clinic.address}</span>
        </a>
      )}

      {/* 電話列 */}
      {clinic.phone && (
        <a
          href={`tel:${clinic.phone}`}
          className="mt-2 flex items-center gap-2.5 rounded-3xl bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/5 transition-all hover:shadow-md"
        >
          <Phone className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">{clinic.phone}</span>
        </a>
      )}
    </div>
  );
}
