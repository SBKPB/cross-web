"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusIcon, PencilIcon, TrashIcon, BriefcaseIcon, CalendarOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { STAFF_ROLES, STAFF_ROLE_OPTIONS } from "@/lib/constants/clinic-constants";
import { StaffServicesDialog } from "./staff-services-dialog";
import { StaffLeaveDialog } from "./staff-leave-dialog";
import type { ApiStaff, ApiStaffCreate, ApiStaffUpdate, ApiStaffRole } from "@/types/clinic";

interface PersonnelTabProps {
  facilityId: string;
}

type PersonnelData = ApiStaff;

export function PersonnelTab({ facilityId }: PersonnelTabProps) {
  const [personnel, setPersonnel] = useState<PersonnelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonnelData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const fetchPersonnel = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminClinicsApi.staff.list(facilityId);
      setPersonnel(data as PersonnelData[]);
    } catch (err) {
      console.error("Failed to fetch personnel:", err);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const filteredPersonnel = roleFilter === "all"
    ? personnel
    : personnel.filter(p => p.role === roleFilter);

  const handleCreate = () => {
    setSelectedPerson(null);
    setFormOpen(true);
  };

  const handleEdit = (person: PersonnelData) => {
    setSelectedPerson(person);
    setFormOpen(true);
  };

  const handleDelete = (person: PersonnelData) => {
    setSelectedPerson(person);
    setDeleteOpen(true);
  };

  const handleManageServices = (person: PersonnelData) => {
    setSelectedPerson(person);
    setServicesDialogOpen(true);
  };

  const handleManageLeave = (person: PersonnelData) => {
    setSelectedPerson(person);
    setLeaveDialogOpen(true);
  };

  const handleFormSubmit = async (data: ApiStaffCreate | ApiStaffUpdate) => {
    setIsSubmitting(true);
    try {
      if (selectedPerson) {
        await adminClinicsApi.staff.update(facilityId, selectedPerson.id, data);
      } else {
        await adminClinicsApi.staff.create(facilityId, data as ApiStaffCreate);
      }
      setFormOpen(false);
      await fetchPersonnel();
    } catch (err) {
      console.error("Failed to save personnel:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPerson) return;
    setIsSubmitting(true);
    try {
      await adminClinicsApi.staff.delete(facilityId, selectedPerson.id);
      setDeleteOpen(false);
      await fetchPersonnel();
    } catch (err) {
      console.error("Failed to delete personnel:", err);
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">人員列表</h2>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {STAFF_ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <PlusIcon className="mr-2 size-4" />
          新增人員
        </Button>
      </div>

      {filteredPersonnel.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground mb-2">尚無人員資料</p>
          <Button size="sm" onClick={handleCreate}>
            <PlusIcon className="mr-2 size-4" />
            新增人員
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPersonnel.map((person) => (
            <PersonnelCard
              key={person.id}
              person={person}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onManageServices={handleManageServices}
              onManageLeave={handleManageLeave}
            />
          ))}
        </div>
      )}

      <PersonnelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        person={selectedPerson}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除「{selectedPerson?.name}」嗎？
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

      <StaffServicesDialog
        open={servicesDialogOpen}
        onOpenChange={setServicesDialogOpen}
        facilityId={facilityId}
        staff={selectedPerson}
      />

      <StaffLeaveDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        facilityId={facilityId}
        staff={selectedPerson}
      />
    </div>
  );
}

// 人員卡片（簡化版）
function PersonnelCard({
  person,
  onEdit,
  onDelete,
  onManageServices,
  onManageLeave,
}: {
  person: PersonnelData;
  onEdit: (person: PersonnelData) => void;
  onDelete: (person: PersonnelData) => void;
  onManageServices: (person: PersonnelData) => void;
  onManageLeave: (person: PersonnelData) => void;
}) {
  const isProfessional = ["doctor", "beautician", "therapist"].includes(person.role);

  return (
    <Card key={person.id} className="p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{person.name}</h3>
            <Badge variant="outline" className="shrink-0 text-xs">
              {STAFF_ROLES[person.role] || person.role}
            </Badge>
          </div>

          {/* 專業人員資訊（醫師/美容師/治療師） */}
          {isProfessional && (
            <div className="mt-1 space-y-0.5">
              {person.main_specialties && person.main_specialties.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  專長: {person.main_specialties.join(", ")}
                </p>
              )}
              {person.experience && person.experience.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  經歷: {person.experience.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* 聯絡資訊 */}
          {person.phone && (
            <p className="text-muted-foreground mt-1 text-sm">{person.phone}</p>
          )}
          {person.email && (
            <p className="text-muted-foreground text-sm">{person.email}</p>
          )}

          {/* 服務/休假按鈕 */}
          {isProfessional && (
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onManageServices(person)}
              >
                <BriefcaseIcon className="mr-1.5 size-3.5" />
                服務
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onManageLeave(person)}
              >
                <CalendarOffIcon className="mr-1.5 size-3.5" />
                休假
              </Button>
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(person)}
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(person)}
          >
            <TrashIcon className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// 表單初始值（簡化版）
interface FormData {
  name: string;
  role: ApiStaffRole;
  phone: string;
  email: string;
  // 專業人員欄位（醫師/美容師/治療師）
  main_specialties: string;
  experience: string;
}

function getInitialFormData(person: PersonnelData | null): FormData {
  if (person) {
    return {
      name: person.name,
      role: person.role,
      phone: person.phone || "",
      email: person.email || "",
      main_specialties: person.main_specialties?.join(", ") || "",
      experience: person.experience?.join("\n") || "",
    };
  }
  return {
    name: "",
    role: "receptionist" as ApiStaffRole,
    phone: "",
    email: "",
    main_specialties: "",
    experience: "",
  };
}

// 表單內容（簡化版）
function PersonnelFormContent({
  person,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  person: PersonnelData | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ApiStaffCreate | ApiStaffUpdate) => Promise<void>;
  isLoading: boolean;
}) {
  const isEditing = !!person;
  const [formData, setFormData] = useState(() => getInitialFormData(person));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: ApiStaffCreate | ApiStaffUpdate = {
      name: formData.name,
      role: formData.role,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
    };

    // 專業人員欄位（醫師/美容師/治療師）
    const isProfessional = ["doctor", "beautician", "therapist"].includes(formData.role);
    if (isProfessional) {
      Object.assign(data, {
        main_specialties: formData.main_specialties
          ? formData.main_specialties.split(",").map(s => s.trim()).filter(Boolean)
          : [],
        experience: formData.experience
          ? formData.experience.split("\n").filter(Boolean)
          : [],
      });
    }

    await onSubmit(data);
  };

  // 專業人員才顯示額外欄位（醫師/美容師/治療師）
  const showProfessionalFields = ["doctor", "beautician", "therapist"].includes(formData.role);

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "編輯人員" : "新增人員"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {/* 基本欄位 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">姓名 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">角色 *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: ApiStaffRole) =>
                setFormData((p) => ({ ...p, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">電話</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">電子郵件</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>
        </div>

        {/* 專業人員欄位（醫師/美容師/治療師） */}
        {showProfessionalFields && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="main_specialties">專長（以逗號分隔）</Label>
              <Input
                id="main_specialties"
                value={formData.main_specialties}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, main_specialties: e.target.value }))
                }
                placeholder="例：整復推拿, 運動傷害"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="experience">經歷（每行一筆）</Label>
              <Textarea
                id="experience"
                value={formData.experience}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, experience: e.target.value }))
                }
                placeholder="XX診所主治&#10;YY醫院復健科"
                rows={3}
              />
            </div>
          </>
        )}
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          取消
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name.trim()}>
          {isLoading ? "處理中..." : isEditing ? "儲存" : "新增"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Dialog 包裝器
function PersonnelFormDialog({
  open,
  onOpenChange,
  person,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: PersonnelData | null;
  onSubmit: (data: ApiStaffCreate | ApiStaffUpdate) => Promise<void>;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        {open && (
          <PersonnelFormContent
            key={person?.id || "new"}
            person={person}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
