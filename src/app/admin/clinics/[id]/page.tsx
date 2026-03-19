"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BuildingIcon,
  UsersIcon,
  BriefcaseIcon,
  CalendarIcon,
  CalendarDaysIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { ClinicFormDialog, ClinicDeleteDialog } from "@/components/admin/clinics";
import { PersonnelTab } from "@/components/admin/clinics/personnel-tab";
import { ServicesTab } from "@/components/admin/clinics/services-tab";
import { AppointmentsTab } from "@/components/admin/clinics/appointments-tab";
import { ScheduleTab } from "@/components/admin/clinics/schedule-tab";
import {
  API_MEDICAL_DEPARTMENTS,
  PAYMENT_TYPES,
} from "@/lib/constants/clinic-constants";
import type { MedicalFacility, MedicalFacilityUpdate } from "@/types/clinic";

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clinicId = params.id as string;

  const [clinic, setClinic] = useState<MedicalFacility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClinic = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminClinicsApi.get(clinicId);
      setClinic(data);
    } catch (err) {
      setError("無法載入院所資料");
      console.error("Failed to fetch clinic:", err);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchClinic();
  }, [fetchClinic]);

  const handleUpdate = async (data: MedicalFacilityUpdate) => {
    setIsSubmitting(true);
    try {
      await adminClinicsApi.update(clinicId, data);
      setEditDialogOpen(false);
      await fetchClinic();
    } catch (err) {
      console.error("Failed to update clinic:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await adminClinicsApi.delete(clinicId);
      router.push("/admin/clinics");
    } catch (err) {
      console.error("Failed to delete clinic:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="border-primary size-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">{error || "找不到院所"}</p>
          <Button variant="outline" onClick={() => router.push("/admin/clinics")}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const formatBusinessHours = (
    hours: Record<string, { open: string; close: string; breaks?: { start: string; end: string }[] }> | null
  ) => {
    if (!hours) return "未設定";
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const dayNames: Record<string, string> = {
      monday: "週一",
      tuesday: "週二",
      wednesday: "週三",
      thursday: "週四",
      friday: "週五",
      saturday: "週六",
      sunday: "週日",
    };
    return days
      .filter((d) => hours[d])
      .map((d) => {
        const h = hours[d];
        let text = `${dayNames[d]} ${h.open}-${h.close}`;
        if (h.breaks?.length) {
          text += `（休息 ${h.breaks.map((b) => `${b.start}-${b.end}`).join("、")}）`;
        }
        return text;
      })
      .join("、") || "未設定";
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{clinic.name}</h1>
            <p className="text-muted-foreground text-sm">
              {API_MEDICAL_DEPARTMENTS[clinic.medical_department]} ·{" "}
              {PAYMENT_TYPES[clinic.payment_type]}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              編輯資訊
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <TrashIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info" className="gap-2">
            <BuildingIcon className="size-4" />
            基本資訊
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <CalendarIcon className="size-4" />
            預約
          </TabsTrigger>
          <TabsTrigger value="personnel" className="gap-2">
            <UsersIcon className="size-4" />
            人員
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <BriefcaseIcon className="size-4" />
            服務項目
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <CalendarDaysIcon className="size-4" />
            排班/休假
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm">院所名稱</h3>
                <p className="font-medium">{clinic.name}</p>
              </div>
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm">科別</h3>
                <p className="font-medium">
                  {API_MEDICAL_DEPARTMENTS[clinic.medical_department]}
                </p>
              </div>
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm">付費類型</h3>
                <p className="font-medium">{PAYMENT_TYPES[clinic.payment_type]}</p>
              </div>
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm">狀態</h3>
                <p className="font-medium">
                  {clinic.is_active ? "啟用" : "停用"}
                </p>
              </div>
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm">電話</h3>
                <p className="font-medium">{clinic.phone || "未設定"}</p>
              </div>
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm">地址</h3>
                <p className="font-medium">{clinic.address || "未設定"}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-muted-foreground mb-1 text-sm">營業時間</h3>
                <p className="font-medium">
                  {formatBusinessHours(clinic.business_hours)}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsTab facilityId={clinicId} />
        </TabsContent>

        <TabsContent value="personnel">
          <PersonnelTab facilityId={clinicId} />
        </TabsContent>

        <TabsContent value="services">
          <ServicesTab facilityId={clinicId} />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleTab facilityId={clinicId} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ClinicFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        clinic={clinic}
        onSubmit={handleUpdate}
        isLoading={isSubmitting}
      />

      <ClinicDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        clinic={clinic}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}
