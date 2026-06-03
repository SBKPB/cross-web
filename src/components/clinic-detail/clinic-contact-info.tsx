"use client";

import { MapPin, Navigation, Phone } from "lucide-react";

import { SectionCard } from "@/components/clinic-detail/section-card";
import { Button } from "@/components/ui/button";
import type { Clinic } from "@/types/clinic";

interface ClinicContactInfoProps {
  clinic: Clinic;
  className?: string;
}

export function ClinicContactInfo({ clinic, className }: ClinicContactInfoProps) {
  if (!clinic.address && !clinic.phone) return null;

  const mapsUrl = clinic.address
    ? `https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`
    : null;

  return (
    <SectionCard icon={MapPin} title="聯絡資訊" className={className}>
      <div className="space-y-3">
        {clinic.address && (
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm leading-relaxed text-foreground">
              {clinic.address}
            </span>
          </div>
        )}
        {clinic.phone && (
          <a
            href={`tel:${clinic.phone}`}
            className="flex items-center gap-2.5 text-foreground transition-colors hover:text-primary"
          >
            <Phone className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm tabular-nums">{clinic.phone}</span>
          </a>
        )}

        {(mapsUrl || clinic.phone) && (
          <div className="flex gap-2 pt-1">
            {mapsUrl && (
              <Button asChild variant="outline" size="sm" className="flex-1">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="size-4" />
                  導航
                </a>
              </Button>
            )}
            {clinic.phone && (
              <Button asChild variant="outline" size="sm" className="flex-1">
                <a href={`tel:${clinic.phone}`}>
                  <Phone className="size-4" />
                  撥打
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
