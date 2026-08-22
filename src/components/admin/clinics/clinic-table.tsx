"use client";

import { PencilIcon, TrashIcon, BuildingIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { cn } from "@/lib/utils";
import type { MedicalFacility } from "@/types/clinic";
import { PAYMENT_TYPES } from "@/lib/constants/clinic-constants";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import { categoryLabel } from "@/lib/api/service-categories";

interface ClinicTableProps {
  clinics: MedicalFacility[];
  onEdit: (clinic: MedicalFacility) => void;
  onDelete: (clinic: MedicalFacility) => void;
}

export function ClinicTable({ clinics, onEdit, onDelete }: ClinicTableProps) {
  const taxonomy = useServiceTaxonomy();

  if (clinics.length === 0) {
    return (
      <AdminEmptyState
        icon={BuildingIcon}
        title="尚無院所資料"
        description="點擊「新增院所」開始建立"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5">
      <Table>
        <TableHeader className="bg-muted/40 [&_th]:font-medium [&_th]:text-muted-foreground">
          <TableRow>
            <TableHead>名稱</TableHead>
            <TableHead>服務子類別</TableHead>
            <TableHead>付費類型</TableHead>
            <TableHead>地址</TableHead>
            <TableHead>電話</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clinics.map((clinic) => (
            <TableRow key={clinic.id} className="transition hover:bg-muted/30">
              <TableCell className="font-medium text-foreground">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                    {clinic.name.charAt(0)}
                  </span>
                  <span className="truncate">{clinic.name}</span>
                </div>
              </TableCell>
              <TableCell>
                {clinic.service_categories.length === 0 ? (
                  <span className="text-muted-foreground">-</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {clinic.service_categories.slice(0, 2).map((code) => (
                      <span
                        key={code}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {categoryLabel(taxonomy, code)}
                      </span>
                    ))}
                    {clinic.service_categories.length > 2 && (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        +{clinic.service_categories.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>{PAYMENT_TYPES[clinic.payment_type]}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {clinic.address || "-"}
              </TableCell>
              <TableCell>{clinic.phone || "-"}</TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(clinic)}
                    title="編輯"
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(clinic)}
                    title="刪除"
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
