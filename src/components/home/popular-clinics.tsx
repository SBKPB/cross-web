import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ClinicCard } from "@/components/clinics/clinic-card";
import type { Clinic } from "@/types/clinic";

interface PopularClinicsProps {
  clinics: Clinic[];
}

export function PopularClinics({ clinics }: PopularClinicsProps) {
  if (clinics.length === 0) return null;

  return (
    <section className="bg-background py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-wide text-primary">
              探索服務
            </p>
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              目前合作店家
            </h2>
            <p className="text-sm text-muted-foreground">
              查看服務、團隊與費用，選擇適合你的店家
            </p>
          </div>
          <Link
            href="/search"
            className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
          >
            查看全部
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic) => (
            <Link key={clinic.id} href={`/clinic/${clinic.id}`} className="block [&_.cursor-pointer]:cursor-pointer">
              <ClinicCard clinic={clinic} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
