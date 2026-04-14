"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Building2, Sparkles, Star, Stethoscope, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  FACILITY_TYPE_COLORS,
  FACILITY_TYPE_LABELS,
  HOSPITAL_LEVELS,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { Clinic, FacilityType } from "@/types/clinic";

const FACILITY_TYPE_ICONS: Record<FacilityType, typeof Stethoscope> = {
  healthcare: Stethoscope,
  self_pay: Wallet,
  aesthetic: Sparkles,
};

interface ClinicDetailHeaderProps {
  clinic: Clinic;
  className?: string;
}

export function ClinicDetailHeader({
  clinic,
  className,
}: ClinicDetailHeaderProps) {
  const hasImages = clinic.images && clinic.images.length > 0;
  const TypeIcon = clinic.facility_type
    ? FACILITY_TYPE_ICONS[clinic.facility_type]
    : null;

  return (
    <div className={cn("relative", className)}>
      {/* Hero banner */}
      <div className="relative h-48 w-full overflow-hidden sm:h-60">
        {hasImages && clinic.images ? (
          <Image
            src={clinic.images[0]}
            alt={clinic.clinic_name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-accent" />
        )}
        {/* 可讀性漸層 */}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

        {/* Back button */}
        <div className="absolute left-4 top-4 z-10">
          <Link
            href="/"
            aria-label="返回首頁"
            className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>
      </div>

      {/* Floating info card */}
      <div className="relative -mt-16 px-4 sm:px-6">
        <div className="rounded-4xl bg-card p-5 shadow-xl ring-1 ring-foreground/5 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Logo 方塊 */}
            <div className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-primary text-2xl font-bold text-primary-foreground shadow-md sm:size-18">
              {clinic.clinic_name.charAt(0)}
            </div>

            {/* Name / badges / rating */}
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">
                {clinic.clinic_name}
              </h1>

              <div className="flex flex-wrap items-center gap-1.5">
                {clinic.facility_type && TypeIcon && (
                  <Badge
                    className={cn(
                      "gap-1 border-0",
                      FACILITY_TYPE_COLORS[clinic.facility_type],
                    )}
                  >
                    <TypeIcon />
                    {FACILITY_TYPE_LABELS[clinic.facility_type]}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  <Building2 />
                  {HOSPITAL_LEVELS[clinic.hospital_level]}
                </Badge>
              </div>

              {clinic.rating !== undefined && clinic.rating !== null && (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Star className="size-4 fill-current" />
                  <span className="text-sm font-semibold text-foreground">
                    {clinic.rating.toFixed(1)}
                  </span>
                  {clinic.review_count && (
                    <span className="text-xs text-muted-foreground">
                      · {clinic.review_count.toLocaleString()} 則評論
                    </span>
                  )}
                </div>
              )}

              {clinic.description && (
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {clinic.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
