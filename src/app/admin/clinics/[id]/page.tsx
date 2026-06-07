"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  BuildingIcon,
  UsersIcon,
  BriefcaseIcon,
  CalendarIcon,
  CalendarDaysIcon,
  Clock,
  Mail,
  MapPin,
  Megaphone,
  Pencil,
  Phone,
  Share2,
  TrashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { ClinicFormDialog, ClinicDeleteDialog } from "@/components/admin/clinics";
import { ShareClinicDialog } from "@/components/clinics/share-clinic-dialog";
import { PersonnelTab } from "@/components/admin/clinics/personnel-tab";
import { ServicesTab } from "@/components/admin/clinics/services-tab";
import { AppointmentsTab } from "@/components/admin/clinics/appointments-tab";
import { ScheduleTab } from "@/components/admin/clinics/schedule-tab";
import { AnnouncementsTab } from "@/components/admin/clinics/announcements-tab";
import { SubscriptionSection } from "@/components/admin/clinics/subscription-section";
import {
  PAYMENT_TYPES,
  FACILITY_TYPE_LABELS,
} from "@/lib/constants/clinic-constants";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import { categoryLabel } from "@/lib/api/service-categories";
import { cn } from "@/lib/utils";
import { lumaPageContainer, lumaSectionTitle } from "@/lib/styles/luma";
import type {
  MedicalFacility,
  MedicalFacilityUpdate,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/types/clinic";

// 方案 → 徽章（標頭直覺顯示「目前方案」；完整狀態 / 到期 / 編輯在下方訂閱資訊）
const PLAN_PILL: Record<SubscriptionPlan, { label: string; cls: string }> = {
  free: { label: "免費方案", cls: "bg-muted text-muted-foreground" },
  standard: { label: "標準方案", cls: "bg-primary/10 text-primary" },
  pro: { label: "專業方案", cls: "bg-primary text-primary-foreground" },
};

// 顯示「目前實際生效方案」：付費/試用到期即視為免費（與即時 gating 一致，
// 不必等每日 cron 物理降級；DB 方案保留以利續約還原）。
function getPlanPill(
  plan: SubscriptionPlan,
  status: SubscriptionStatus,
  expiresAt: string | null,
): { label: string; cls: string } {
  if (status === "suspended")
    return { label: "已暫停", cls: "bg-destructive/10 text-destructive" };
  if (status === "cancelled")
    return { label: "已取消", cls: "bg-muted text-muted-foreground" };
  const expired = !!expiresAt && new Date(expiresAt).getTime() < Date.now();
  if (expired) return PLAN_PILL.free; // 到期 → 免費方案
  if (status === "trial")
    return { label: "試用中", cls: "bg-amber-100 text-amber-700" };
  return PLAN_PILL[plan];
}

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clinicId = params.id as string;
  const taxonomy = useServiceTaxonomy();

  const [clinic, setClinic] = useState<MedicalFacility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
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
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className={lumaPageContainer}>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="mb-4 text-destructive">{error || "找不到院所"}</p>
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

  // 服務子類別 code 攤成中文 label（多個以「、」串接）
  const serviceCategoriesLabel =
    clinic.service_categories.length > 0
      ? clinic.service_categories
          .map((code) => categoryLabel(taxonomy, code))
          .join("、")
      : "未設定";

  const planPill = getPlanPill(
    clinic.subscription_plan,
    clinic.subscription_status,
    clinic.subscription_expires_at,
  );

  const infoFields: { icon: typeof Phone; label: string; value: string }[] = [
    { icon: Phone, label: "電話", value: clinic.phone || "未設定" },
    { icon: MapPin, label: "地址", value: clinic.address || "未設定" },
    {
      icon: BriefcaseIcon,
      label: "服務子類別",
      value: serviceCategoriesLabel,
    },
    {
      icon: Mail,
      label: "付費類型",
      value: PAYMENT_TYPES[clinic.payment_type],
    },
    {
      icon: BuildingIcon,
      label: "服務類型（民眾端）",
      value: FACILITY_TYPE_LABELS[clinic.facility_type],
    },
    {
      icon: Clock,
      label: "營業時間",
      value: formatBusinessHours(clinic.business_hours),
    },
  ];

  return (
    <div className={lumaPageContainer}>
      {/* Header */}
      <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {clinic.logo_url ? (
              <Image
                src={clinic.logo_url}
                alt={clinic.name}
                width={56}
                height={56}
                className="size-14 shrink-0 rounded-2xl object-cover ring-1 ring-foreground/10"
              />
            ) : (
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
                {clinic.name.charAt(0)}
              </span>
            )}
            <div className="min-w-0 space-y-1.5">
              <h1 className={lumaSectionTitle}>{clinic.name}</h1>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    clinic.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {clinic.is_active ? "啟用" : "停用"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    planPill.cls,
                  )}
                >
                  {planPill.label}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {FACILITY_TYPE_LABELS[clinic.facility_type]}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={() => setShareDialogOpen(true)}>
              <Share2 className="size-4" />
              分享頁面
            </Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="size-4" />
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
      <Tabs defaultValue="info" className="space-y-5">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/50 p-1.5">
          <TabsTrigger
            value="info"
            className="gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-foreground/5"
          >
            <BuildingIcon className="size-4" />
            基本資訊
          </TabsTrigger>
          <TabsTrigger
            value="appointments"
            className="gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-foreground/5"
          >
            <CalendarIcon className="size-4" />
            預約
          </TabsTrigger>
          <TabsTrigger
            value="personnel"
            className="gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-foreground/5"
          >
            <UsersIcon className="size-4" />
            人員
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-foreground/5"
          >
            <BriefcaseIcon className="size-4" />
            服務項目
          </TabsTrigger>
          {clinic.show_schedule && (
            <TabsTrigger
              value="schedule"
              className="gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-foreground/5"
            >
              <CalendarDaysIcon className="size-4" />
              排班/休假
            </TabsTrigger>
          )}
          <TabsTrigger
            value="announcements"
            className="gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-foreground/5"
          >
            <Megaphone className="size-4" />
            公告
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-5">
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
            <h2 className="mb-5 text-base font-semibold text-foreground">
              院所資訊
            </h2>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {infoFields.map((field, i) => {
                const FieldIcon = field.icon;
                return (
                  <div
                    key={field.label}
                    className={cn(
                      "flex items-start gap-3",
                      i === infoFields.length - 1 && "sm:col-span-2",
                    )}
                  >
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FieldIcon className="size-4" />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {field.label}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {field.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <SubscriptionSection
            facility={clinic}
            onUpdated={(updated) => setClinic(updated)}
          />
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

        {clinic.show_schedule && (
          <TabsContent value="schedule">
            <ScheduleTab facilityId={clinicId} />
          </TabsContent>
        )}

        <TabsContent value="announcements">
          <AnnouncementsTab facilityId={clinicId} />
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

      <ShareClinicDialog
        clinicId={clinic.id}
        clinicName={clinic.name}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </div>
  );
}
