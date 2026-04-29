"use client";

import { MapPin, Navigation, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Clinic } from "@/types/clinic";

interface ClinicContactInfoProps {
  clinic: Clinic;
  className?: string;
}

export function ClinicContactInfo({ clinic, className }: ClinicContactInfoProps) {
  // 地址 / 電話兩者都空就整段不渲染，避免出現空白卡或孤零零的單一 tile
  if (!clinic.address && !clinic.phone) {
    return null;
  }

  const actionTileClass = cn(
    "group/tile flex w-32 flex-col items-center gap-1.5 rounded-3xl bg-card px-3 py-4",
    "shadow-sm ring-1 ring-foreground/5",
    "transition-all hover:-translate-y-0.5 hover:shadow-md",
  );

  const iconCircleClass =
    "flex size-11 items-center justify-center rounded-full transition-colors";

  return (
    <div className={cn("px-4 sm:px-6", className)}>
      {/* Quick action row（地址/電話可點，僅在有資料時呈現） */}
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
