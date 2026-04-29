"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  isStaffRole,
  requiresFacility,
  STAFF_ROLE_NAMES,
} from "@/lib/auth/roles";
import { lumaDialogFooter } from "@/lib/styles/luma";
import { cn } from "@/lib/utils";
import type {
  AdminUser,
  AdminUserCreate,
  AdminUserUpdate,
  Role,
} from "@/types/user";
import type { MedicalFacility } from "@/types/clinic";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUser | null;
  roles: Role[];
  facilities: MedicalFacility[];
  /** 表單模式：staff（員工，預設）或 patient（民眾端會員，隱藏所屬院所與角色） */
  kind?: "staff" | "patient";
  onSubmit: (data: AdminUserCreate | AdminUserUpdate) => Promise<void>;
  isLoading?: boolean;
}

interface FormData {
  email: string;
  password: string;
  phone_number: string;
  facility_id: string;
  is_active: boolean;
  role_id: string;
  role_name: string;
}

function getInitialFormData(user: AdminUser | null | undefined): FormData {
  if (user) {
    return {
      email: user.email,
      password: "",
      phone_number: user.phone_number || "",
      facility_id: user.facility_id || "",
      is_active: user.is_active,
      role_id: "",
      role_name: "",
    };
  }
  return {
    email: "",
    password: "",
    phone_number: "",
    facility_id: "",
    is_active: true,
    role_id: "",
    role_name: "",
  };
}

function UserFormContent({
  user,
  roles,
  facilities,
  kind = "staff",
  onOpenChange,
  onSubmit,
  isLoading,
}: Omit<UserFormDialogProps, "open">) {
  const isEditing = !!user;
  const isPatient = kind === "patient";
  const [formData, setFormData] = useState<FormData>(() =>
    getInitialFormData(user),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // 角色清單依「是否選了院所」過濾：
  //   有選院所 → 只顯示院所端角色（facility_admin / facility_staff）
  //   未選院所 → 只顯示系統端角色（superadmin / admin）
  // 避免操作者把「超級管理員」誤指派給院所人員
  const staffRoles = useMemo(() => {
    const order = STAFF_ROLE_NAMES;
    const allStaff = roles.filter((r) => isStaffRole(r.name));
    const scoped = formData.facility_id
      ? allStaff.filter((r) => requiresFacility(r.name))
      : allStaff.filter((r) => !requiresFacility(r.name));
    return scoped.sort(
      (a, b) =>
        order.indexOf(a.name as (typeof STAFF_ROLE_NAMES)[number]) -
        order.indexOf(b.name as (typeof STAFF_ROLE_NAMES)[number]),
    );
  }, [roles, formData.facility_id]);

  const facilityRequired = requiresFacility(formData.role_name);

  const handleRoleChange = (roleId: string) => {
    const role = staffRoles.find((r) => r.id === roleId);
    if (!role) return;
    setFormData((prev) => ({
      ...prev,
      role_id: role.id,
      role_name: role.name,
    }));
    setValidationError(null);
  };

  const handleFacilityChange = (value: string) => {
    const newFacilityId = value === "_none" ? "" : value;
    setFormData((prev) => {
      // 切換院所/系統範圍時，若原本選的角色已不在新清單，清掉
      const stillValid =
        !prev.role_name ||
        (newFacilityId
          ? requiresFacility(prev.role_name)
          : !requiresFacility(prev.role_name));
      return {
        ...prev,
        facility_id: newFacilityId,
        role_id: stillValid ? prev.role_id : "",
        role_name: stillValid ? prev.role_name : "",
      };
    });
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (isEditing) {
      const data: AdminUserUpdate = {
        email: formData.email,
        is_active: formData.is_active,
        phone_number: formData.phone_number || null,
        facility_id: formData.facility_id || null,
      };
      await onSubmit(data);
      return;
    }

    // 新增模式必須選 role
    if (!formData.role_id) {
      setValidationError("請選擇角色");
      return;
    }
    // facility 角色必須選院所
    if (facilityRequired && !formData.facility_id) {
      setValidationError("此角色必須指派所屬院所");
      return;
    }

    const data: AdminUserCreate = {
      email: formData.email,
      password: formData.password,
      phone_number: formData.phone_number || undefined,
      facility_id: facilityRequired ? formData.facility_id : undefined,
      role_ids: [formData.role_id],
    };
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "編輯使用者" : "新增使用者"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "修改使用者資訊" : "填寫使用者基本資料"}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">
            電子信箱 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="user@example.com"
            required
          />
        </div>

        {!isEditing && (
          <div className="grid gap-2">
            <Label htmlFor="password">
              密碼 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="請輸入密碼"
              required
              minLength={6}
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="phone_number">電話號碼</Label>
          <Input
            id="phone_number"
            value={formData.phone_number}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                phone_number: e.target.value,
              }))
            }
            placeholder="例：0912-345-678"
          />
        </div>

        {/* 所屬院所：先決定範圍（系統 vs 院所），角色清單依此過濾。
            民眾端會員（patient）不顯示這欄。 */}
        {!isPatient && (
        <div className="grid gap-2">
          <Label htmlFor="facility_id">所屬院所</Label>
          <Select
            value={formData.facility_id || "_none"}
            onValueChange={handleFacilityChange}
          >
            <SelectTrigger id="facility_id" className="w-full">
              <SelectValue placeholder="選擇院所" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">無（系統管理員）</SelectItem>
              {facilities.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isEditing && (
            <p className="text-xs text-muted-foreground">
              {formData.facility_id
                ? "將建立院所端使用者（角色限院所管理員 / 院所職員）"
                : "將建立系統端使用者（角色限超級管理員 / 系統管理員）"}
            </p>
          )}
        </div>
        )}

        {/* 角色：員工模式下新增時必選，編輯時不變更；patient 模式不顯示 */}
        {!isEditing && !isPatient && (
          <div className="grid gap-2">
            <Label>
              角色 <span className="text-destructive">*</span>
            </Label>
            {staffRoles.length > 0 ? (
              <RadioGroup
                value={formData.role_id}
                onValueChange={handleRoleChange}
                className="rounded-2xl p-3 ring-1 ring-foreground/5"
              >
                {staffRoles.map((role) => (
                  <label
                    key={role.id}
                    htmlFor={`role-${role.id}`}
                    className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-muted/40"
                  >
                    <RadioGroupItem
                      value={role.id}
                      id={`role-${role.id}`}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {role.display_name}
                      </div>
                      {role.description && (
                        <div className="text-xs text-muted-foreground">
                          {role.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </RadioGroup>
            ) : (
              <div className="rounded-2xl bg-destructive/5 p-3 text-sm text-destructive ring-1 ring-destructive/20">
                {formData.facility_id
                  ? "系統尚未建立院所端角色（facility_admin / facility_staff），請先聯絡系統管理員初始化角色資料。"
                  : "系統尚未建立系統端角色（superadmin / admin），請先聯絡系統管理員初始化角色資料。"}
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  is_active: checked === true,
                }))
              }
            />
            <Label htmlFor="is_active" className="font-normal">
              啟用帳號
            </Label>
          </div>
        )}

        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}
      </div>

      <DialogFooter className={cn("mt-6", lumaDialogFooter)}>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={
            isLoading ||
            !formData.email.trim() ||
            (!isEditing && !formData.password.trim()) ||
            (!isEditing && staffRoles.length === 0)
          }
        >
          {isLoading ? "處理中..." : isEditing ? "儲存" : "新增"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  facilities,
  onSubmit,
  isLoading = false,
}: UserFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {open && (
          <UserFormContent
            key={user?.id || "new"}
            user={user}
            roles={roles}
            facilities={facilities}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
