"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BriefcaseIcon,
  CalendarOffIcon,
  UsersIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { StaffDetailDialog } from "@/components/admin/clinics/staff-detail-dialog";
import { lumaCardHover, lumaDialogFooter } from "@/lib/styles/luma";
import { cn } from "@/lib/utils";

/** 哪些角色支援「點卡片看詳細」與學歷欄位 */
const HAS_DETAIL_VIEW: ReadonlySet<string> = new Set(["doctor", "therapist"]);
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailPerson, setDetailPerson] = useState<PersonnelData | null>(null);

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

  const handleOpenDetail = (person: PersonnelData) => {
    setDetailPerson(person);
    setDetailDialogOpen(true);
  };

  const handleFormSubmit = async (
    data: ApiStaffCreate | ApiStaffUpdate,
  ): Promise<ApiStaff | null> => {
    setIsSubmitting(true);
    try {
      const saved = selectedPerson
        ? await adminClinicsApi.staff.update(
            facilityId,
            selectedPerson.id,
            data,
          )
        : await adminClinicsApi.staff.create(facilityId, data as ApiStaffCreate);
      return saved;
    } catch (err) {
      console.error("Failed to save personnel:", err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormDone = async () => {
    setFormOpen(false);
    await fetchPersonnel();
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
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">人員列表</h2>
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
        <AdminEmptyState
          icon={UsersIcon}
          title="尚無人員資料"
          description="新增人員開始管理"
          action={
            <Button size="sm" onClick={handleCreate}>
              <PlusIcon className="mr-2 size-4" />
              新增人員
            </Button>
          }
        />
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
              onOpenDetail={handleOpenDetail}
            />
          ))}
        </div>
      )}

      <PersonnelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        facilityId={facilityId}
        person={selectedPerson}
        onSubmit={handleFormSubmit}
        onDone={handleFormDone}
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
          <DialogFooter className={lumaDialogFooter}>
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

      <StaffDetailDialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) setDetailPerson(null);
        }}
        staff={detailPerson}
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
  onOpenDetail,
}: {
  person: PersonnelData;
  onEdit: (person: PersonnelData) => void;
  onDelete: (person: PersonnelData) => void;
  onManageServices: (person: PersonnelData) => void;
  onManageLeave: (person: PersonnelData) => void;
  onOpenDetail: (person: PersonnelData) => void;
}) {
  const isProfessional = ["doctor", "beautician", "therapist"].includes(person.role);
  const hasDetailView = HAS_DETAIL_VIEW.has(person.role);

  // 阻止 nested button 觸發 card click
  const stop = (handler: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    handler();
  };

  return (
    <Card
      key={person.id}
      className={cn(
        "p-5",
        hasDetailView && cn("cursor-pointer", lumaCardHover),
      )}
      onClick={hasDetailView ? () => onOpenDetail(person) : undefined}
    >
      <div className="flex items-start gap-3">
        {/* 頭像 */}
        <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/5">
          {person.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.avatar_url}
              alt={person.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              {person.name.slice(0, 1)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-foreground">
              {person.name}
            </h3>
            <Badge variant="outline" className="shrink-0">
              {STAFF_ROLES[person.role] || person.role}
            </Badge>
            {/* 民眾端可見性圖示 */}
            <span
              className={cn(
                "inline-flex shrink-0 items-center",
                person.is_public_visible
                  ? "text-primary"
                  : "text-muted-foreground/60",
              )}
              title={
                person.is_public_visible
                  ? "民眾端顯示中"
                  : "民眾端隱藏"
              }
            >
              {person.is_public_visible ? (
                <EyeIcon className="size-3.5" />
              ) : (
                <EyeOffIcon className="size-3.5" />
              )}
            </span>
          </div>

          {/* 專業人員資訊（醫師/美容師/治療師） */}
          {isProfessional && (
            <div className="mt-1 space-y-0.5">
              {person.main_specialties &&
                person.main_specialties.length > 0 && (
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    專長: {person.main_specialties.join(", ")}
                  </p>
                )}
              {person.experience && person.experience.length > 0 && (
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  經歷: {person.experience.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* 聯絡資訊 */}
          {person.phone && (
            <p className="mt-1 text-sm text-muted-foreground">{person.phone}</p>
          )}
          {person.email && (
            <p className="text-sm text-muted-foreground">{person.email}</p>
          )}

          {/* 服務/休假按鈕 */}
          {isProfessional && (
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={stop(() => onManageServices(person))}
              >
                <BriefcaseIcon className="mr-1.5 size-3.5" />
                服務
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={stop(() => onManageLeave(person))}
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
            onClick={stop(() => onEdit(person))}
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={stop(() => onDelete(person))}
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
  // 民眾端可見性 + 頭像
  is_public_visible: boolean;
  avatar_url: string | null;
  // 專業人員欄位（醫師/美容師/治療師）
  main_specialties: string;
  experience: string;
  // 醫師/治療師額外欄位
  education: string;
}

/** 該角色預設是否在民眾端可見：只有 doctor 預設 true */
function defaultVisibilityForRole(role: ApiStaffRole): boolean {
  return role === "doctor";
}

function getInitialFormData(person: PersonnelData | null): FormData {
  if (person) {
    return {
      name: person.name,
      role: person.role,
      phone: person.phone || "",
      email: person.email || "",
      is_public_visible: person.is_public_visible,
      avatar_url: person.avatar_url,
      main_specialties: person.main_specialties?.join(", ") || "",
      experience: person.experience?.join("\n") || "",
      education: person.education?.join("\n") || "",
    };
  }
  return {
    name: "",
    role: "receptionist" as ApiStaffRole,
    phone: "",
    email: "",
    is_public_visible: false,
    avatar_url: null,
    main_specialties: "",
    experience: "",
    education: "",
  };
}

// 表單內容（簡化版）
function PersonnelFormContent({
  facilityId,
  person,
  onOpenChange,
  onSubmit,
  onDone,
  isLoading,
}: {
  facilityId: string;
  person: PersonnelData | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: ApiStaffCreate | ApiStaffUpdate,
  ) => Promise<ApiStaff | null>;
  onDone: () => void | Promise<void>;
  isLoading: boolean;
}) {
  const isEditing = !!person;
  const [formData, setFormData] = useState(() => getInitialFormData(person));
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    person?.avatar_url || null,
  );
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // 切換角色時，自動套用該角色的預設可見性（僅新增模式）
  const handleRoleChange = (value: ApiStaffRole) => {
    setFormData((p) => ({
      ...p,
      role: value,
      // 編輯時不要覆蓋使用者已選的 visibility
      is_public_visible: isEditing ? p.is_public_visible : defaultVisibilityForRole(value),
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("檔案不可超過 5MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("僅支援 JPG / PNG / WebP");
      return;
    }

    setPendingAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadAvatarFor = async (staffId: string) => {
    if (!pendingAvatarFile) return;
    setIsUploadingAvatar(true);
    try {
      await adminClinicsApi.staff.uploadAvatar(
        facilityId,
        staffId,
        pendingAvatarFile,
      );
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setAvatarError("照片上傳失敗，但人員資料已儲存");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: ApiStaffCreate | ApiStaffUpdate = {
      name: formData.name,
      role: formData.role,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      is_public_visible: formData.is_public_visible,
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

    // 學歷欄位只給支援詳細頁的角色（doctor / therapist）
    if (HAS_DETAIL_VIEW.has(formData.role)) {
      Object.assign(data, {
        education: formData.education
          ? formData.education.split("\n").filter(Boolean)
          : [],
      });
    }

    const saved = await onSubmit(data);
    if (!saved) return;

    // 有新照片要上傳 → 用剛拿到的 staff id 上傳
    if (pendingAvatarFile) {
      await uploadAvatarFor(saved.id);
    }

    await onDone();
  };

  // 專業人員才顯示額外欄位（醫師/美容師/治療師）
  const showProfessionalFields = ["doctor", "beautician", "therapist"].includes(formData.role);
  const showEducation = HAS_DETAIL_VIEW.has(formData.role);

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "編輯人員" : "新增人員"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "修改人員資料、照片與民眾端可見性"
            : "填寫人員基本資料與角色"}
        </DialogDescription>
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
              onValueChange={(value: ApiStaffRole) => handleRoleChange(value)}
            >
              <SelectTrigger id="role">
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

        {/* 照片上傳 + 可見性 */}
        <div className="grid gap-3 rounded-2xl p-4 ring-1 ring-foreground/5">
          <Label>照片與顯示設定</Label>
          <div className="flex items-start gap-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/5">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={formData.name || "avatar"}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                  無照片
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
              <p className="text-xs text-muted-foreground">
                JPG / PNG / WebP，最大 5MB · 自動轉檔 AVIF + 縮圖至 800px
                {!isEditing && " · 儲存後自動上傳"}
              </p>
              {avatarError && (
                <p className="text-xs text-destructive">{avatarError}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="is_public_visible"
              checked={formData.is_public_visible}
              onCheckedChange={(checked) =>
                setFormData((p) => ({
                  ...p,
                  is_public_visible: checked === true,
                }))
              }
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="is_public_visible" className="font-normal">
                在民眾端顯示此人員
              </Label>
              <p className="text-xs text-muted-foreground">
                關閉後，此人員不會出現在民眾預約頁與診所詳情頁
              </p>
            </div>
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

        {showEducation && (
          <div className="grid gap-2">
            <Label htmlFor="education">學歷（每行一筆）</Label>
            <Textarea
              id="education"
              value={formData.education}
              onChange={(e) =>
                setFormData((p) => ({ ...p, education: e.target.value }))
              }
              placeholder="台大醫學系&#10;北醫復健研究所"
              rows={3}
            />
          </div>
        )}
      </div>
      <DialogFooter className={lumaDialogFooter}>
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
  facilityId,
  person,
  onSubmit,
  onDone,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  person: PersonnelData | null;
  onSubmit: (
    data: ApiStaffCreate | ApiStaffUpdate,
  ) => Promise<ApiStaff | null>;
  onDone: () => void | Promise<void>;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        {open && (
          <PersonnelFormContent
            key={person?.id || "new"}
            facilityId={facilityId}
            person={person}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            onDone={onDone}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
