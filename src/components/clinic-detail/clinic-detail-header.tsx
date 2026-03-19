"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ArrowLeft, Building2 } from "lucide-react";
import type { Clinic } from "@/types/clinic";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HOSPITAL_LEVELS } from "@/lib/constants/clinic-constants";

interface ClinicDetailHeaderProps {
  clinic: Clinic;
  className?: string;
}

export function ClinicDetailHeader({
  clinic,
  className,
}: ClinicDetailHeaderProps) {
  const hasImages = clinic.images && clinic.images.length > 0;

  return (
    <div className={cn("relative", className)}>
      {/* Hero gradient banner */}
      <div className="relative h-44 w-full overflow-hidden sm:h-56">
        {hasImages && clinic.images ? (
          <Image
            src={clinic.images[0]}
            alt={clinic.clinic_name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-n-brand via-n-brand-hover to-n-accent" />
        )}
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Back button */}
        <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>
      </div>

      {/* Clinic info card overlapping hero */}
      <div className="relative -mt-14 px-4 sm:px-6">
        <div className="rounded-2xl border border-n-border bg-n-card p-4 shadow-lg sm:p-5">
          <div className="flex items-start gap-3.5">
            {/* Logo */}
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-n-brand text-xl font-bold text-white shadow-md sm:size-16 sm:text-2xl">
              {clinic.clinic_name.charAt(0)}
            </div>

            {/* Name, level, rating */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-n-heading sm:text-xl">
                  {clinic.clinic_name}
                </h1>
                <Badge
                  variant="secondary"
                  className="border-none bg-n-brand-soft text-n-brand"
                >
                  <Building2 className="size-3" />
                  {HOSPITAL_LEVELS[clinic.hospital_level]}
                </Badge>
              </div>

              {clinic.rating && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-n-heading">
                    {clinic.rating.toFixed(1)}
                  </span>
                  {clinic.review_count && (
                    <span className="text-sm text-n-secondary">
                      ({clinic.review_count.toLocaleString()} 則評論)
                    </span>
                  )}
                </div>
              )}

              {clinic.description && (
                <p className="mt-2 text-sm leading-relaxed text-n-body line-clamp-2">
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
