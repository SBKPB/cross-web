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
import { Badge } from "@/components/ui/badge";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import {
  lumaTableHeader,
  lumaTableRowHover,
  lumaTableShell,
} from "@/lib/styles/luma";
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
    <div className={lumaTableShell}>
      <Table>
        <TableHeader className={lumaTableHeader}>
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
            <TableRow key={clinic.id} className={lumaTableRowHover}>
              <TableCell className="font-medium text-foreground">
                {clinic.name}
              </TableCell>
              <TableCell>
                {clinic.service_categories.length === 0 ? (
                  <span className="text-muted-foreground">-</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {clinic.service_categories.slice(0, 2).map((code) => (
                      <Badge key={code} variant="outline">
                        {categoryLabel(taxonomy, code)}
                      </Badge>
                    ))}
                    {clinic.service_categories.length > 2 && (
                      <Badge variant="outline">
                        +{clinic.service_categories.length - 2}
                      </Badge>
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
                <Badge variant={clinic.is_active ? "secondary" : "outline"}>
                  {clinic.is_active ? "啟用" : "停用"}
                </Badge>
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
