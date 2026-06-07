"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Flower2,
  MapPin,
  Share2,
  Sparkles,
  Star,
  Stethoscope,
  Store,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ShareClinicDialog } from "@/components/clinics/share-clinic-dialog";
import {
  FACILITY_TYPE_COLORS,
  FACILITY_TYPE_LABELS,
  HOSPITAL_LEVELS,
  PAYMENT_TYPES,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { Clinic, FacilityType } from "@/types/clinic";

const FACILITY_TYPE_ICONS: Record<FacilityType, typeof Stethoscope> = {
  healthcare: Stethoscope,
  aesthetic: Sparkles,
  beauty: Flower2,
  other: Store,
};

interface ClinicDetailHeaderProps {
  clinic: Clinic;
  className?: string;
}

export function ClinicDetailHeader({ clinic, className }: ClinicDetailHeaderProps) {
  const hasImage = !!clinic.images?.length;
  const TypeIcon = clinic.facility_type ? FACILITY_TYPE_ICONS[clinic.facility_type] : null;
  const showHospitalLevel =
    !clinic.facility_type || clinic.facility_type === "healthcare";
  const rating = clinic.rating ?? null;
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <section className={cn("relative", className)}>
      {/* ===== 裝飾性 banner ===== */}
      <div className="relative h-56 w-full overflow-hidden sm:h-64">
        {hasImage && clinic.images ? (
          <>
            <Image
              src={clinic.images[0]}
              alt={clinic.clinic_name}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/30 to-blue-900/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-primary to-sky-500" />
        )}

        {/* 柔光暈 */}
        <div className="pointer-events-none absolute -top-24 right-[8%] size-72 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute top-10 left-[12%] size-56 rounded-full bg-sky-300/25 blur-3xl" />
        {/* 點陣 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at top right, black, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at top right, black, transparent 75%)",
          }}
        />
        {/* 同心圓裝飾 */}
        <div className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-6 size-96 rounded-full border border-white/10" />

        {/* 返回 + 分享 */}
        <div className="container relative mx-auto flex items-center justify-between px-4 pt-5 sm:px-6">
          <Link
            href="/"
            aria-label="返回首頁"
            className="inline-flex size-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="分享此頁面"
            className="inline-flex size-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
          >
            <Share2 className="size-5" />
          </button>
        </div>
      </div>

      {/* ===== 院所識別卡（疊在 banner 上） ===== */}
      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="-mt-20 rounded-[1.75rem] bg-card p-5 shadow-xl ring-1 ring-foreground/5 sm:-mt-24 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            {/* Logo：有上傳用圖、否則院所名首字頭像 */}
            {clinic.logo ? (
              <div className="size-20 shrink-0 overflow-hidden rounded-[1.25rem] bg-white shadow-lg shadow-primary/15 ring-1 ring-foreground/10 sm:size-24">
                <Image
                  src={clinic.logo}
                  alt={`${clinic.clinic_name} logo`}
                  width={96}
                  height={96}
                  className="size-full object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary to-sky-500 text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/20 sm:size-24 sm:text-4xl">
                {clinic.clinic_name.charAt(0)}
              </div>
            )}

            {/* 識別資訊 */}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {clinic.facility_type && TypeIcon && (
                  <Badge
                    className={cn("gap-1 border-0", FACILITY_TYPE_COLORS[clinic.facility_type])}
                  >
                    <TypeIcon />
                    {FACILITY_TYPE_LABELS[clinic.facility_type]}
                  </Badge>
                )}
                {/* 付款方式（健保 / 自費 / 健保+自費），取代舊 self_pay 大類語意 */}
                {clinic.payment_type && (
                  <Badge variant="outline" className="bg-card text-muted-foreground">
                    {PAYMENT_TYPES[clinic.payment_type]}
                  </Badge>
                )}
                {showHospitalLevel && (
                  <Badge variant="secondary" className="gap-1 bg-accent text-accent-foreground">
                    <Building2 />
                    {HOSPITAL_LEVELS[clinic.hospital_level]}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                {clinic.clinic_name}
              </h1>

              {/* 評分 + 關鍵資訊 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                {rating !== null && (
                  <span className="flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3.5",
                            i < Math.round(rating) ? "fill-current" : "fill-muted stroke-muted-foreground/30",
                          )}
                        />
                      ))}
                    </span>
                    <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                    {clinic.review_count ? (
                      <span className="text-muted-foreground">
                        ({clinic.review_count.toLocaleString()})
                      </span>
                    ) : null}
                  </span>
                )}
                {clinic.city && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="size-4" />
                    {clinic.city}
                  </span>
                )}
              </div>

              {clinic.description && (
                <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {clinic.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ShareClinicDialog
        clinicId={clinic.id}
        clinicName={clinic.clinic_name}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </section>
  );
}
