"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { lumaDialogFooter } from "@/lib/admin/luma-styles";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import type { ApiStaff, ApiService, ApiStaffService } from "@/types/clinic";

interface StaffServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  staff: ApiStaff | null;
}

export function StaffServicesDialog({
  open,
  onOpenChange,
  facilityId,
  staff,
}: StaffServicesDialogProps) {
  const [allServices, setAllServices] = useState<ApiService[]>([]);
  const [staffServices, setStaffServices] = useState<ApiStaffService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(
    new Map()
  );

  const fetchData = useCallback(async () => {
    if (!staff) return;
    setIsLoading(true);
    try {
      const [services, staffSvcs] = await Promise.all([
        adminClinicsApi.services.list(facilityId),
        adminClinicsApi.staffServices.list(facilityId, staff.id),
      ]);
      setAllServices(services);
      setStaffServices(staffSvcs);
      setPendingChanges(new Map());
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, staff]);

  useEffect(() => {
    if (open && staff) {
      fetchData();
    }
  }, [open, staff, fetchData]);

  const isServiceAssigned = (serviceId: string): boolean => {
    if (pendingChanges.has(serviceId)) {
      return pendingChanges.get(serviceId)!;
    }
    return staffServices.some((s) => s.service_id === serviceId);
  };

  const handleToggle = (serviceId: string, checked: boolean) => {
    setPendingChanges((prev) => {
      const next = new Map(prev);
      const currentAssigned = staffServices.some(
        (s) => s.service_id === serviceId
      );
      if (checked === currentAssigned) {
        next.delete(serviceId);
      } else {
        next.set(serviceId, checked);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!staff || pendingChanges.size === 0) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      const promises: Promise<unknown>[] = [];

      for (const [serviceId, shouldAssign] of pendingChanges) {
        if (shouldAssign) {
          promises.push(
            adminClinicsApi.staffServices.add(facilityId, staff.id, {
              service_id: serviceId,
            })
          );
        } else {
          promises.push(
            adminClinicsApi.staffServices.remove(facilityId, staff.id, serviceId)
          );
        }
      }

      await Promise.all(promises);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save staff services:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>管理服務項目</DialogTitle>
          <DialogDescription>
            設定「{staff?.name}」可提供的服務項目
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        ) : allServices.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            尚無服務項目，請先在「服務項目」分頁新增服務
          </div>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-2">
            {allServices.map((service) => {
              const checked = isServiceAssigned(service.id);
              return (
                <label
                  key={service.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl p-3 ring-1 ring-foreground/5 transition hover:ring-primary/20"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(val) =>
                      handleToggle(service.id, val === true)
                    }
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="cursor-pointer font-medium text-foreground">
                        {service.service_name}
                      </Label>
                      <span className="shrink-0 text-sm font-medium text-primary">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{service.duration_minutes} 分鐘</span>
                      {service.description && (
                        <>
                          <span>·</span>
                          <span className="line-clamp-1">
                            {service.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <DialogFooter className={lumaDialogFooter}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? "儲存中..." : "儲存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
