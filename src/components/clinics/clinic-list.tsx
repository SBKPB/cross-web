"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";

import { ClinicCard } from "@/components/clinics/clinic-card";
import { ClinicDetailDialog } from "@/components/clinics/clinic-detail-dialog";
import { cn } from "@/lib/utils";
import type { Clinic } from "@/types/clinic";

interface ClinicListProps {
  clinics: Clinic[];
  className?: string;
}

export function ClinicList({ clinics, className }: ClinicListProps) {
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCardClick = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setDialogOpen(true);
  };

  if (clinics.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4",
          "text-center",
          className
        )}
      >
        <div className="rounded-full bg-muted border border-border p-4 mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          找不到符合條件的院所
        </h3>
        <p className="text-sm text-muted-foreground">
          請嘗試調整搜尋條件或篩選器
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid gap-4",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
      >
        {clinics.map((clinic) => (
          <ClinicCard
            key={clinic.id}
            clinic={clinic}
            onClick={() => handleCardClick(clinic)}
          />
        ))}
      </div>

      <ClinicDetailDialog
        clinic={selectedClinic}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
