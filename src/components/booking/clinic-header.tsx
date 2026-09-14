"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClinicConfig } from "@/types/booking";

export function ClinicHeader({ clinic, className }: { clinic: ClinicConfig; className?: string }) {
  return (
    <div className={cn("border-b border-border/60 bg-[#eff4fa] dark:bg-[#142238]", className)}>
      <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-8">
        <Link href={`/clinic/${clinic.id}`} className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />返回店家介紹</Link>
        {clinic.hero_banner && <div className="relative mt-4 h-32 overflow-hidden rounded-3xl sm:h-40"><Image src={clinic.hero_banner} alt={clinic.clinic_name} fill priority sizes="768px" className="object-cover" /></div>}
        <div className="mt-4 flex items-start gap-4">
          {clinic.logo ? <Image src={clinic.logo} alt="" width={64} height={64} unoptimized className="size-14 shrink-0 rounded-2xl bg-white object-contain sm:size-16" /> : <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-card text-2xl text-primary sm:size-16">{clinic.clinic_name.slice(0, 1)}</span>}
          <div className="min-w-0">
            <p className="home-eyebrow">BOOK A VISIT / 安排你的時間</p>
            <h1 className="mt-2 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{clinic.clinic_name}</h1>
            {clinic.address && <a href={clinic.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-start gap-1.5 text-xs leading-6 text-muted-foreground hover:text-primary"><MapPin className="mt-1 size-3.5 shrink-0" />{clinic.address}</a>}
            {clinic.phone && <a href={`tel:${clinic.phone}`} className="mt-1 inline-flex min-h-8 items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"><Phone className="size-3.5" />{clinic.phone}</a>}
          </div>
        </div>
      </div>
    </div>
  );
}
