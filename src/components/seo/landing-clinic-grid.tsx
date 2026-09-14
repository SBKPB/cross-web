import Link from "next/link";
import { ArrowUpRight, Crown, MapPin, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { categoryLabel, type ServiceTaxonomy } from "@/lib/api/service-categories";
import type { LandingClinic } from "@/lib/seo/landing-data";

interface LandingClinicGridProps {
  clinics: LandingClinic[];
  taxonomy: ServiceTaxonomy;
}

/**
 * 在地落地頁的診所清單（伺服器渲染、純連結卡）。
 * 用 <a> 直連 /clinic/{id}，確保爬蟲能爬到每個診所頁（內部連結權重傳遞）。
 */
export function LandingClinicGrid({ clinics, taxonomy }: LandingClinicGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clinics.map((clinic) => (
        <li key={clinic.id}>
          <Link
            href={`/clinic/${clinic.id}`}
            className="group flex h-full flex-col gap-4 rounded-3xl border border-border/80 bg-card p-6 transition-colors hover:border-primary/40"
          >
            <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-2xl bg-accent/60 text-2xl text-primary">{clinic.name.slice(0, 1)}</span>
            <div className="flex items-center gap-1.5">
              {clinic.is_featured && (
                <Badge className="gap-1 border-0 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950">
                  <Crown className="size-3.5" />
                  精選
                </Badge>
              )}
              <h2 className="line-clamp-1 text-base font-semibold text-foreground group-hover:text-primary">
                {clinic.name}
              </h2>
            </div>

            {clinic.departments.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {clinic.departments.slice(0, 3).map((code) => (
                  <Badge key={code} variant="outline" className="text-muted-foreground">
                    {categoryLabel(taxonomy, code)}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-auto space-y-1.5 text-sm text-muted-foreground">
              {clinic.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span className="line-clamp-2">{clinic.address}</span>
                </div>
              )}
              {clinic.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0" />
                  <span>{clinic.phone}</span>
                </div>
              )}
            </div>
            <span className="mt-2 inline-flex items-center justify-between border-t border-border pt-4 text-sm font-medium text-primary">認識店家 <ArrowUpRight className="size-4" /></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
