"use client";

import { useState } from "react";
import { SearchX } from "lucide-react";

import { ClinicCard } from "@/components/clinics/clinic-card";
import { ClinicDetailDialog } from "@/components/clinics/clinic-detail-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Clinic } from "@/types/clinic";

const GRID_CLASS = "grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

interface ClinicListProps {
  clinics: Clinic[];
  className?: string;
  onReset?: () => void;
}

export function ClinicList({ clinics, className, onReset }: ClinicListProps) {
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
          "flex flex-col items-center justify-center rounded-3xl bg-card px-4 py-16 text-center ring-1 ring-border/60",
          className,
        )}
      >
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-accent text-primary">
          <SearchX className="size-7" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-foreground">
          找不到符合條件的店家
        </h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          試著放寬關鍵字或調整篩選條件，或許就能找到適合的選擇。
        </p>
        {onReset && (
          <Button variant="outline" className="mt-5" onClick={onReset}>
            清除所有篩選
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={cn(GRID_CLASS, className)}>
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

/** 載入中的骨架卡片網格，版面與真實卡片一致，避免內容跳動 */
export function ClinicListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} aria-hidden>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
