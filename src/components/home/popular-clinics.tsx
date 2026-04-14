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
    <section className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              熱門診所
            </h2>
            <p className="text-sm text-muted-foreground">
              民眾最常預約的醫療院所
            </p>
          </div>
          <Link
            href="/search"
            className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
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
