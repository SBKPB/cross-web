"use client";

import Image from "next/image";
import { MapPin, Phone } from "lucide-react";
import type { ClinicConfig } from "@/types/booking";
import { cn } from "@/lib/utils";

interface ClinicHeaderProps {
  clinic: ClinicConfig;
  className?: string;
}

export function ClinicHeader({ clinic, className }: ClinicHeaderProps) {
  return (
    <div className={cn("bg-white", className)}>
      {/* Hero Banner */}
      {clinic.hero_banner && (
        <div className="relative h-32 w-full bg-gradient-to-r from-pink-100 to-purple-100">
          <Image
            src={clinic.hero_banner}
            alt={clinic.clinic_name}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Clinic Info */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          {/* Logo */}
          {clinic.logo ? (
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm">
              <Image
                src={clinic.logo}
                alt={clinic.clinic_name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-white shadow-sm"
              style={{ backgroundColor: clinic.primary_color }}
            >
              {clinic.clinic_name.charAt(0)}
            </div>
          )}

          {/* Name & Contact */}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-slate-900">
              {clinic.clinic_name}
            </h1>

            <div className="mt-1.5 space-y-1">
              {clinic.address && (
                <a
                  href={clinic.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  <span className="line-clamp-1">{clinic.address}</span>
                </a>
              )}

              {clinic.phone && (
                <a
                  href={`tel:${clinic.phone}`}
                  className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                  <Phone className="size-3.5 shrink-0 text-slate-400" />
                  <span>{clinic.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
