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
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import {
  API_MEDICAL_DEPARTMENTS,
  PAYMENT_TYPES,
} from "@/lib/constants/clinic-constants";
import type {
  MedicalFacility,
  MedicalFacilityCreate,
  MedicalFacilityUpdate,
} from "@/types/clinic";

export default function AdminClinicsPage() {
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
            clinic.address?.toLowerCase().includes(term)
        )
      );
    }
  }, [clinics, searchTerm]);

  const handleClinicClick = (clinic: MedicalFacility) => {
    router.push(`/admin/clinics/${clinic.id}`);
  };

  const handleCreate = async (data: MedicalFacilityCreate | MedicalFacilityUpdate) => {
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
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">院所管理</h1>
          <p className="text-muted-foreground text-sm">
            選擇院所進行設定，或新增院所
          </p>
        </div>
        <Button onClick={() => setFormDialogOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          新增院所
        </Button>
      </div>

      {/* 搜尋 */}
      <div className="relative mb-6">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="搜尋院所名稱或地址..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 院所列表 */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-2">{error}</p>
          <Button variant="outline" onClick={fetchClinics}>
            重試
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="border-primary size-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      ) : filteredClinics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BuildingIcon className="text-muted-foreground mb-4 size-12" />
          <p className="text-muted-foreground">尚無院所資料</p>
          <p className="text-muted-foreground mb-4 text-sm">
            點擊「新增院所」開始建立
          </p>
          <Button onClick={() => setFormDialogOpen(true)}>
            <PlusIcon className="mr-2 size-4" />
            新增院所
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClinics.map((clinic) => (
            <Card
              key={clinic.id}
              className="cursor-pointer p-4 transition-shadow hover:shadow-md"
              onClick={() => handleClinicClick(clinic)}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{clinic.name}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {API_MEDICAL_DEPARTMENTS[clinic.medical_department]}
                  </p>
                  {clinic.address && (
                    <p className="text-muted-foreground mt-1 truncate text-sm">
                      {clinic.address}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {PAYMENT_TYPES[clinic.payment_type]}
                    </Badge>
                    <Badge
                      variant={clinic.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {clinic.is_active ? "啟用" : "停用"}
                    </Badge>
                  </div>
                </div>
                <ChevronRightIcon className="text-muted-foreground size-5 shrink-0" />
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
