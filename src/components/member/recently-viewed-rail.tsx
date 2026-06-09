"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { History, MapPin } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { favoritesApi } from "@/lib/api/favorites";
import {
  FACILITY_TYPE_COLORS,
  FACILITY_TYPE_LABELS,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { Clinic } from "@/types/clinic";

/**
 * 最近瀏覽橫向 rail（民眾端會員頁）。
 * - 由後端 GET /member/recently-viewed 取得（最新在前，上限 10）。
 * - 無資料則整塊隱藏。
 */
export function RecentlyViewedRail({ ready }: { ready: boolean }) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await favoritesApi.listRecentlyViewed();
      setClinics(data);
    } catch {
      setClinics([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    fetchRecent();
  }, [ready, fetchRecent]);

  // 載入完成且無資料：不顯示整塊
  if (!isLoading && clinics.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-1.5 text-base font-semibold text-foreground">
        <History className="size-4 text-muted-foreground" />
        最近瀏覽
      </h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="w-44 shrink-0 p-3" aria-hidden>
                <Skeleton className="size-11 rounded-2xl" />
                <Skeleton className="mt-2 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </Card>
            ))
          : clinics.map((clinic) => (
              <Link
                key={clinic.id}
                href={`/clinic/${clinic.id}`}
                className="shrink-0"
              >
                <Card className="flex w-44 flex-col gap-2 p-3 transition-shadow hover:shadow-md">
                  {/* Logo / 首字頭像 */}
                  {clinic.logo ? (
                    <div className="size-11 overflow-hidden rounded-2xl bg-white ring-1 ring-foreground/10">
                      <Image
                        src={clinic.logo}
                        alt={`${clinic.clinic_name} logo`}
                        width={44}
                        height={44}
                        className="size-full object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-sky-500 text-base font-bold text-primary-foreground">
                      {clinic.clinic_name.charAt(0)}
                    </span>
                  )}
                  <div className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                    {clinic.clinic_name}
                  </div>
                  {clinic.facility_type && (
                    <Badge
                      className={cn(
                        "w-fit border-0 text-[11px]",
                        FACILITY_TYPE_COLORS[clinic.facility_type],
                      )}
                    >
                      {FACILITY_TYPE_LABELS[clinic.facility_type]}
                    </Badge>
                  )}
                  {clinic.city && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      {clinic.city}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
      </div>
    </div>
  );
}
