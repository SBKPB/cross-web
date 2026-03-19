"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import type { ApiService, ApiServiceCreate, ApiServiceUpdate } from "@/types/clinic";

interface ServicesTabProps {
  facilityId: string;
}

export function ServicesTab({ facilityId }: ServicesTabProps) {
  const [services, setServices] = useState<ApiService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ApiService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminClinicsApi.services.list(facilityId);
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleCreate = () => {
    setSelectedService(null);
    setFormOpen(true);
  };

  const handleEdit = (s: ApiService) => {
    setSelectedService(s);
    setFormOpen(true);
  };

  const handleDelete = (s: ApiService) => {
    setSelectedService(s);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (data: ApiServiceCreate | ApiServiceUpdate) => {
    setIsSubmitting(true);
    try {
      if (selectedService) {
        await adminClinicsApi.services.update(facilityId, selectedService.id, data);
      } else {
        await adminClinicsApi.services.create(facilityId, data as ApiServiceCreate);
      }
      setFormOpen(false);
      await fetchServices();
    } catch (err) {
      console.error("Failed to save service:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedService) return;
    setIsSubmitting(true);
    try {
      await adminClinicsApi.services.delete(facilityId, selectedService.id);
      setDeleteOpen(false);
      await fetchServices();
    } catch (err) {
      console.error("Failed to delete service:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">服務項目列表</h2>
        <Button size="sm" onClick={handleCreate}>
          <PlusIcon className="mr-2 size-4" />
          新增服務
        </Button>
      </div>

      {services.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground mb-2">尚無服務項目</p>
          <Button size="sm" onClick={handleCreate}>
            <PlusIcon className="mr-2 size-4" />
            新增服務
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{s.service_name}</h3>
                  <p className="text-primary mt-1 font-medium">
                    {formatPrice(s.price)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {s.duration_minutes} 分鐘
                  </p>
                  {s.description && (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {s.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(s)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(s)}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        service={selectedService}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除「{selectedService?.service_name}」嗎？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? "刪除中..." : "確認刪除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 表單初始值
function getInitialServiceFormData(service: ApiService | null) {
  if (service) {
    return {
      service_name: service.service_name,
      description: service.description || "",
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
    };
  }
  return {
    service_name: "",
    description: "",
    price: "",
    duration_minutes: "30",
  };
}

// 表單內容
function ServiceFormContent({
  service,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  service: ApiService | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ApiServiceCreate | ApiServiceUpdate) => Promise<void>;
  isLoading: boolean;
}) {
  const isEditing = !!service;
  const [formData, setFormData] = useState(() => getInitialServiceFormData(service));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      service_name: formData.service_name,
      description: formData.description || undefined,
      price: Number(formData.price),
      duration_minutes: Number(formData.duration_minutes),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "編輯服務" : "新增服務"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="service_name">服務名稱 *</Label>
          <Input
            id="service_name"
            value={formData.service_name}
            onChange={(e) =>
              setFormData((p) => ({ ...p, service_name: e.target.value }))
            }
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="price">價格 (NT$) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData((p) => ({ ...p, price: e.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration_minutes">時長（分鐘）</Label>
            <Input
              id="duration_minutes"
              type="number"
              min="5"
              step="5"
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  duration_minutes: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">描述</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
            rows={3}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={
            isLoading ||
            !formData.service_name.trim() ||
            !formData.price
          }
        >
          {isLoading ? "處理中..." : isEditing ? "儲存" : "新增"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Dialog 包裝器
function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ApiService | null;
  onSubmit: (data: ApiServiceCreate | ApiServiceUpdate) => Promise<void>;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        {open && (
          <ServiceFormContent
            key={service?.id || "new"}
            service={service}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
