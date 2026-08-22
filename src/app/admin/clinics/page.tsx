"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  SearchIcon,
  ChevronRightIcon,
  BuildingIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ClinicFormDialog } from "@/components/admin/clinics";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { useRequireSystemAdmin } from "@/lib/auth/use-require-system-admin";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { PAYMENT_TYPES } from "@/lib/constants/clinic-constants";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import { categoryLabel } from "@/lib/api/service-categories";
import { cn } from "@/lib/utils";
import type {
  MedicalFacility,
  MedicalFacilityCreate,
  MedicalFacilityUpdate,
} from "@/types/clinic";

export default function AdminClinicsPage() {
  useRequireSystemAdmin();
  const router = useRouter();
  const taxonomy = useServiceTaxonomy();
  const [clinics, setClinics] = useState<MedicalFacility[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<MedicalFacility[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClinics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminClinicsApi.list();
      setClinics(data);
    } catch (err) {
      setError("無法載入院所資料");
      console.error("Failed to fetch clinics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClinics(clinics);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredClinics(
        clinics.filter(
          (clinic) =>
            clinic.name.toLowerCase().includes(term) ||
            clinic.address?.toLowerCase().includes(term),
        ),
      );
    }
  }, [clinics, searchTerm]);

  const handleClinicClick = (clinic: MedicalFacility) => {
    router.push(`/admin/clinics/${clinic.id}`);
  };

  const handleCreate = async (
    data: MedicalFacilityCreate | MedicalFacilityUpdate,
  ) => {
    setIsSubmitting(true);
    try {
      await adminClinicsApi.create(data as MedicalFacilityCreate);
      setFormDialogOpen(false);
      await fetchClinics();
    } catch (err) {
      console.error("Failed to create clinic:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 卡片空間有限：最多顯示前 2 個服務子類別 label，其餘以「+N」呈現
  const formatServiceCategories = (codes: string[]): string => {
    if (codes.length === 0) return "未設定";
    const labels = codes.map((code) => categoryLabel(taxonomy, code));
    if (labels.length <= 2) return labels.join("、");
    return `${labels.slice(0, 2).join("、")} +${labels.length - 2}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground before:size-2 before:shrink-0 before:rounded-full before:bg-primary before:content-['']">
            院所管理
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            選擇院所進行設定，或新增院所
          </p>
        </div>
        <Button onClick={() => setFormDialogOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          新增院所
        </Button>
      </div>

      <div className="rounded-3xl bg-card p-2 shadow-sm ring-1 ring-foreground/5">
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋院所名稱或地址..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {error ? (
        <AdminEmptyState
          icon={BuildingIcon}
          title={error}
          action={
            <Button variant="outline" onClick={fetchClinics}>
              重試
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : filteredClinics.length === 0 ? (
        <AdminEmptyState
          icon={BuildingIcon}
          title="尚無院所資料"
          description="點擊「新增院所」開始建立"
          action={
            <Button onClick={() => setFormDialogOpen(true)}>
              <PlusIcon className="mr-2 size-4" />
              新增院所
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClinics.map((clinic) => (
            <Card
              key={clinic.id}
              className="cursor-pointer rounded-3xl p-6 shadow-sm ring-1 ring-foreground/5 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/15"
              onClick={() => handleClinicClick(clinic)}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-base font-semibold text-primary">
                  {clinic.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="truncate text-base font-semibold text-foreground">
                    {clinic.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatServiceCategories(clinic.service_categories)}
                  </p>
                  {clinic.address && (
                    <p className="truncate text-sm text-muted-foreground">
                      {clinic.address}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {PAYMENT_TYPES[clinic.payment_type]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        clinic.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {clinic.is_active ? "啟用" : "停用"}
                    </span>
                  </div>
                </div>
                <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <ClinicFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSubmit={handleCreate}
        isLoading={isSubmitting}
      />
    </div>
  );
}
