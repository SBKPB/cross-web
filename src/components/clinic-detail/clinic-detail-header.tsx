"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Share2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/clinics/favorite-button";
import { ShareClinicDialog } from "@/components/clinics/share-clinic-dialog";
import { FACILITY_TYPE_LABELS, HOSPITAL_LEVELS, PAYMENT_TYPES } from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { Clinic } from "@/types/clinic";

export function ClinicDetailHeader({ clinic, className }: { clinic: Clinic; className?: string }) {
  const [shareOpen, setShareOpen] = useState(false);
  return (
    <section className={cn("border-b border-border/60 bg-[#eff4fa] dark:bg-[#142238]", className)}>
      <div className="home-container py-6 sm:py-10">
        <div className="mb-7 flex items-center justify-between gap-3">
          <Link href="/search" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />探索服務</Link>
          <div className="flex items-center gap-2">
            <FavoriteButton clinicId={clinic.id} nextPath={`/clinic/${clinic.id}`} />
            <Button variant="outline" size="icon" onClick={() => setShareOpen(true)} aria-label="分享此頁面"><Share2 className="size-4" /></Button>
          </div>
        </div>
        {clinic.images?.[0] && <div className="relative mb-7 h-48 overflow-hidden rounded-3xl sm:h-64"><Image src={clinic.images[0]} alt={clinic.clinic_name} fill priority sizes="(min-width: 1280px) 1160px, 100vw" className="object-cover" /></div>}
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-7">
          {clinic.logo ? <Image src={clinic.logo} alt={`${clinic.clinic_name} logo`} width={96} height={96} unoptimized className="size-20 shrink-0 rounded-3xl border border-border/70 bg-white object-contain sm:size-24" /> : <span aria-hidden="true" className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-card text-3xl font-medium text-primary sm:size-24 sm:text-4xl">{clinic.clinic_name.slice(0, 1)}</span>}
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap gap-2">
              {clinic.facility_type && <Badge variant="secondary">{FACILITY_TYPE_LABELS[clinic.facility_type]}</Badge>}
              {clinic.payment_type && <Badge variant="outline">{PAYMENT_TYPES[clinic.payment_type]}</Badge>}
              {(!clinic.facility_type || clinic.facility_type === "healthcare") && <Badge variant="outline">{HOSPITAL_LEVELS[clinic.hospital_level]}</Badge>}
            </div>
            <h1 className="text-3xl font-semibold leading-snug tracking-tight sm:text-4xl">{clinic.clinic_name}</h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {clinic.city && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{clinic.city}</span>}
              {clinic.rating != null && <span className="inline-flex items-center gap-1.5"><Star className="size-4 fill-amber-400 text-amber-400" />{clinic.rating.toFixed(1)}{clinic.review_count ? `（${clinic.review_count} 則評論）` : ""}</span>}
            </div>
            {clinic.description && <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">{clinic.description}</p>}
          </div>
        </div>
        <nav aria-label="店家內容" className="mt-7 flex flex-wrap gap-2 border-t border-border/70 pt-5 text-sm">
          {clinic.services?.length ? <a href="#services" className="rounded-full bg-card px-4 py-2.5 hover:text-primary">服務與費用</a> : null}
          {clinic.members?.length ? <a href="#team" className="rounded-full bg-card px-4 py-2.5 hover:text-primary">專業團隊</a> : null}
          <a href="#contact" className="rounded-full bg-card px-4 py-2.5 hover:text-primary">聯絡與交通</a>
        </nav>
      </div>
      <ShareClinicDialog clinicId={clinic.id} clinicName={clinic.clinic_name} open={shareOpen} onOpenChange={setShareOpen} />
    </section>
  );
}
