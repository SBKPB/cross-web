"use client";

import { BarChart3 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { isFacilityUser } from "@/lib/auth/roles";
import { FacilityAnalyticsView } from "@/components/admin/clinics/analytics-tab";

/**
 * 院所帳號的客戶分析頁。呈現層與診所詳情頁的「客戶分析」分頁共用
 * FacilityAnalyticsView，差別只在 variant（未開通時這裡顯示升級牆）。
 */
export default function AnalyticsPage() {
  const { user } = useAuth();
  const facilityId = user?.facility_id ?? null;

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground before:size-2 before:shrink-0 before:rounded-full before:bg-primary before:content-['']">
        <BarChart3 className="size-6" />
        客戶分析
      </h1>
      {!isFacilityUser(user) || !facilityId ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          客戶分析供院所帳號使用。系統管理員請至「院所管理」選擇診所後，
          切換到「客戶分析」分頁查看。
        </Card>
      ) : (
        <FacilityAnalyticsView
          facilityId={facilityId}
          facility={user?.facility}
          variant="facility"
        />
      )}
    </div>
  );
}
