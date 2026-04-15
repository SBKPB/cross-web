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
import { Checkbox } from "@/components/ui/checkbox";
import { lumaDialogFooter } from "@/lib/admin/luma-styles";
import { cn } from "@/lib/utils";
import type { AdminUser, Role } from "@/types/user";

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  allRoles: Role[];
  currentRoleIds: string[];
  onConfirm: (roleIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

function UserRoleContent({
  user,
  allRoles,
  currentRoleIds,
  onOpenChange,
  onConfirm,
  isLoading,
}: Omit<UserRoleDialogProps, "open">) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    () => [...currentRoleIds]
  );

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleConfirm = async () => {
    await onConfirm(selectedRoleIds);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>角色管理</DialogTitle>
        <DialogDescription>
          設定「{user?.email}」的角色
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        {allRoles.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無可用角色</p>
        ) : (
          allRoles.map((role) => {
            const checked = selectedRoleIds.includes(role.id);
            return (
              <label
                key={role.id}
                htmlFor={`role-assign-${role.id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl p-3 ring-1 transition",
                  checked
                    ? "ring-primary bg-primary/5"
                    : "ring-foreground/5 hover:ring-primary/20",
                )}
              >
                <Checkbox
                  id={`role-assign-${role.id}`}
                  checked={checked}
                  onCheckedChange={() => toggleRole(role.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">
                    {role.display_name}
                  </div>
                  {role.description && (
                    <div className="text-xs text-muted-foreground">
                      {role.description}
                    </div>
                  )}
                </div>
              </label>
            );
          })
        )}
      </div>

      <DialogFooter className={lumaDialogFooter}>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? "儲存中..." : "儲存"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function UserRoleDialog({
  open,
  onOpenChange,
  user,
  allRoles,
  currentRoleIds,
  onConfirm,
  isLoading = false,
}: UserRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <UserRoleContent
            key={`${user?.id}-${currentRoleIds.join(",")}`}
            user={user}
            allRoles={allRoles}
            currentRoleIds={currentRoleIds}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
