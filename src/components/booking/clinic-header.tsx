"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ClinicConfig } from "@/types/booking";

interface ClinicHeaderProps {
  clinic: ClinicConfig;
  className?: string;
}

export function ClinicHeader({ clinic, className }: ClinicHeaderProps) {
  return (
    <div className={cn("relative", className)}>
      {/* 裝飾性 banner（有上傳用圖，否則主色漸層光暈，對齊院所詳情頁） */}
      <div className="relative h-40 w-full overflow-hidden sm:h-44">
        {clinic.hero_banner ? (
          <>
            <Image
              src={clinic.hero_banner}
              alt={clinic.clinic_name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(135deg, ${clinic.primary_color}, color-mix(in srgb, ${clinic.primary_color} 60%, #0ea5e9))`,
            }}
          />
        )}

        {/* 柔光暈 + 點陣裝飾 */}
        <div className="pointer-events-none absolute -top-20 right-[8%] size-60 rounded-full bg-white/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at top right, black, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at top right, black, transparent 75%)",
          }}
        />

        {/* 返回院所頁 */}
        <div className="container relative mx-auto flex items-center px-4 pt-5 sm:px-6">
          <Link
            href={`/clinic/${clinic.id}`}
            aria-label="返回院所頁"
            className="inline-flex size-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>
      </div>

      {/* 院所識別卡（疊在 banner 上） */}
      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="-mt-12 rounded-3xl bg-card p-5 shadow-xl ring-1 ring-foreground/5">
          <div className="flex items-start gap-4">
            {/* Logo */}
            {clinic.logo ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-foreground/10">
                <Image
                  src={clinic.logo}
                  alt={clinic.clinic_name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-sm"
                style={{ backgroundColor: clinic.primary_color }}
              >
                {clinic.clinic_name.charAt(0)}
              </div>
            )}

            {/* Name & Contact */}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {clinic.clinic_name}
              </h1>

              <div className="mt-2 space-y-1">
                {clinic.address && (
                  <a
                    href={
                      clinic.google_maps_url ||
                      `https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span className="line-clamp-1">{clinic.address}</span>
                  </a>
                )}

                {clinic.phone && (
                  <a
                    href={`tel:${clinic.phone}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="size-3.5 shrink-0" />
                    <span>{clinic.phone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
