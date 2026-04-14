"use client";

import Image from "next/image";
import { MapPin, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ClinicConfig } from "@/types/booking";

interface ClinicHeaderProps {
  clinic: ClinicConfig;
  className?: string;
}

export function ClinicHeader({ clinic, className }: ClinicHeaderProps) {
  return (
    <div className={cn("bg-background", className)}>
      {/* Hero Banner */}
      {clinic.hero_banner && (
        <div className="relative h-40 w-full overflow-hidden bg-accent">
          <Image
            src={clinic.hero_banner}
            alt={clinic.clinic_name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Clinic Info Card — floating when hero exists */}
      <div
        className={cn(
          "px-4",
          clinic.hero_banner ? "relative -mt-10 z-[1]" : "pt-4",
        )}
      >
        <div
          className={cn(
            "rounded-4xl bg-card p-5 shadow-md ring-1 ring-foreground/5",
          )}
        >
          <div className="flex items-start gap-4">
            {/* Logo */}
            {clinic.logo ? (
              <div className="relative size-14 shrink-0 overflow-hidden rounded-3xl ring-1 ring-foreground/5 shadow-sm">
                <Image
                  src={clinic.logo}
                  alt={clinic.clinic_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-3xl text-2xl font-bold text-white shadow-sm"
                style={{ backgroundColor: clinic.primary_color }}
              >
                {clinic.clinic_name.charAt(0)}
              </div>
            )}

            {/* Name & Contact */}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold text-foreground">
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
