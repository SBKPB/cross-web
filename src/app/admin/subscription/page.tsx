"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { isFacilityUser, isSystemAdmin } from "@/lib/auth/roles";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { SubscriptionSection } from "@/components/admin/clinics/subscription-section";
import { lumaPageContainer } from "@/lib/styles/luma";
import type { MedicalFacility } from "@/types/clinic";

export default function MySubscriptionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [facility, setFacility] = useState<MedicalFacility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 系統管理員不該進來這頁，導去院所管理
  useEffect(() => {
    if (authLoading) return;
    if (isSystemAdmin(user)) {
      router.replace("/admin/clinics");
      return;
    }
    if (!isFacilityUser(user)) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const facilityId = user?.facility_id;
  const fetchFacility = useCallback(async () => {
    if (!facilityId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminClinicsApi.get(facilityId);
      setFacility(data);
    } catch (err) {
      console.error("Failed to load facility:", err);
      setError("無法載入訂閱資訊");
    } finally {
      setIsLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    if (authLoading) return;
    fetchFacility();
  }, [authLoading, fetchFacility]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className={lumaPageContainer}>
        <div className="flex items-center gap-3 rounded-3xl bg-destructive/10 p-6 text-sm text-destructive ring-1 ring-destructive/20">
          <AlertTriangle className="size-5 shrink-0" />
          <span>{error || "找不到訂閱資料"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={lumaPageContainer}>
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground before:size-2 before:shrink-0 before:rounded-full before:bg-primary before:content-['']">
          我的訂閱
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {facility.name} 的訂閱方案與付款狀態
        </p>
      </div>

      <SubscriptionSection
        facility={facility}
        onUpdated={(updated) => setFacility(updated)}
      />
    </div>
  );
}
