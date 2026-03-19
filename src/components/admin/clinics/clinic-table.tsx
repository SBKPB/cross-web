"use client";

import { PencilIcon, TrashIcon } from "lucide-react";
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
import type { MedicalFacility } from "@/types/clinic";
import {
  API_MEDICAL_DEPARTMENTS,
  PAYMENT_TYPES,
} from "@/lib/constants/clinic-constants";

interface ClinicTableProps {
  clinics: MedicalFacility[];
  onEdit: (clinic: MedicalFacility) => void;
  onDelete: (clinic: MedicalFacility) => void;
}

export function ClinicTable({ clinics, onEdit, onDelete }: ClinicTableProps) {
  if (clinics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">尚無院所資料</p>
        <p className="text-muted-foreground text-sm">點擊「新增院所」開始建立</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名稱</TableHead>
          <TableHead>科別</TableHead>
          <TableHead>付費類型</TableHead>
          <TableHead>地址</TableHead>
          <TableHead>電話</TableHead>
          <TableHead>狀態</TableHead>
          <TableHead className="w-[100px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clinics.map((clinic) => (
          <TableRow key={clinic.id}>
            <TableCell className="font-medium">{clinic.name}</TableCell>
            <TableCell>
              {API_MEDICAL_DEPARTMENTS[clinic.medical_department]}
            </TableCell>
            <TableCell>{PAYMENT_TYPES[clinic.payment_type]}</TableCell>
            <TableCell className="max-w-[200px] truncate">
              {clinic.address || "-"}
            </TableCell>
            <TableCell>{clinic.phone || "-"}</TableCell>
            <TableCell>
              <Badge variant={clinic.is_active ? "default" : "secondary"}>
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
  );
}
