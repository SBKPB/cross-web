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
import { Badge } from "@/components/ui/badge";
import { ClinicFormDialog } from "@/components/admin/clinics";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { useRequireSystemAdmin } from "@/lib/auth/use-require-system-admin";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import {
  API_MEDICAL_DEPARTMENTS,
  PAYMENT_TYPES,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import {
  lumaCardHover,
  lumaCardInner,
  lumaPageContainer,
  lumaSectionDesc,
  lumaSectionTitle,
} from "@/lib/styles/luma";
import type {
  MedicalFacility,
  MedicalFacilityCreate,
  MedicalFacilityUpdate,
} from "@/types/clinic";

export default function AdminClinicsPage() {
  useRequireSystemAdmin();
  const router = useRouter();
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

  return (
    <div className={lumaPageContainer}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className={lumaSectionTitle}>院所管理</h1>
          <p className={lumaSectionDesc}>選擇院所進行設定，或新增院所</p>
        </div>
        <Button onClick={() => setFormDialogOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          新增院所
        </Button>
      </div>

      <div className={cn(lumaCardInner, "p-3")}>
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋院所名稱或地址..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
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
              className={cn("cursor-pointer p-6", lumaCardHover)}
              onClick={() => handleClinicClick(clinic)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="truncate text-base font-semibold text-foreground">
                    {clinic.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {API_MEDICAL_DEPARTMENTS[clinic.medical_department]}
                  </p>
                  {clinic.address && (
                    <p className="truncate text-sm text-muted-foreground">
                      {clinic.address}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="outline">
                      {PAYMENT_TYPES[clinic.payment_type]}
                    </Badge>
                    <Badge
                      variant={clinic.is_active ? "secondary" : "outline"}
                    >
                      {clinic.is_active ? "啟用" : "停用"}
                    </Badge>
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
