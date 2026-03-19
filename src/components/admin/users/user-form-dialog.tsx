"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { AdminUser, AdminUserCreate, AdminUserUpdate, Role } from "@/types/user";
import type { MedicalFacility } from "@/types/clinic";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUser | null;
  roles: Role[];
  facilities: MedicalFacility[];
  onSubmit: (data: AdminUserCreate | AdminUserUpdate) => Promise<void>;
  isLoading?: boolean;
}

interface FormData {
  email: string;
  password: string;
  phone_number: string;
  facility_id: string;
  is_active: boolean;
  role_ids: string[];
}

function getInitialFormData(user: AdminUser | null | undefined): FormData {
  if (user) {
    return {
      email: user.email,
      password: "",
      phone_number: user.phone_number || "",
      facility_id: user.facility_id || "",
      is_active: user.is_active,
      role_ids: [],
    };
  }
  return {
    email: "",
    password: "",
    phone_number: "",
    facility_id: "",
    is_active: true,
    role_ids: [],
  };
}

function UserFormContent({
  user,
  roles,
  facilities,
  onOpenChange,
  onSubmit,
  isLoading,
}: Omit<UserFormDialogProps, "open">) {
  const isEditing = !!user;
  const [formData, setFormData] = useState<FormData>(() =>
    getInitialFormData(user)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      const data: AdminUserUpdate = {
        email: formData.email,
        is_active: formData.is_active,
        phone_number: formData.phone_number || null,
        facility_id: formData.facility_id || null,
      };
      await onSubmit(data);
    } else {
      const data: AdminUserCreate = {
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number || undefined,
        facility_id: formData.facility_id || undefined,
        role_ids:
          formData.role_ids.length > 0 ? formData.role_ids : undefined,
      };
      await onSubmit(data);
    }
  };

  const toggleRole = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId],
    }));
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

        <div className="grid gap-2">
          <Label htmlFor="facility_id">所屬院所</Label>
          <Select
            value={formData.facility_id || "_none"}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                facility_id: value === "_none" ? "" : value,
              }))
            }
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
        </div>

        {!isEditing && roles.length > 0 && (
          <div className="grid gap-2">
            <Label>角色</Label>
            <div className="space-y-2 rounded-md border p-3">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={formData.role_ids.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                  />
                  <Label htmlFor={`role-${role.id}`} className="font-normal">
                    {role.display_name}
                    {role.description && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        {role.description}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
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
      </div>

      <DialogFooter className="mt-6">
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
            (!isEditing && !formData.password.trim())
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
