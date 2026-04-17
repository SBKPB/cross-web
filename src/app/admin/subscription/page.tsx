"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { isFacilityUser, isSystemAdmin } from "@/lib/auth/roles";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { SubscriptionSection } from "@/components/admin/clinics/subscription-section";
import {
  lumaPageContainer,
  lumaSectionDesc,
  lumaSectionTitle,
} from "@/lib/styles/luma";
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
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className={lumaPageContainer}>
        <p className="text-sm text-destructive">{error || "找不到訂閱資料"}</p>
      </div>
    );
  }

  return (
    <div className={lumaPageContainer}>
      <div className="space-y-1">
        <h1 className={lumaSectionTitle}>我的訂閱</h1>
        <p className={lumaSectionDesc}>
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
