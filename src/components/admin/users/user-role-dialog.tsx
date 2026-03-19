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
import { Label } from "@/components/ui/label";
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

      <div className="space-y-2 rounded-md border p-3">
        {allRoles.length === 0 ? (
          <p className="text-muted-foreground text-sm">尚無可用角色</p>
        ) : (
          allRoles.map((role) => (
            <div key={role.id} className="flex items-center gap-2">
              <Checkbox
                id={`role-assign-${role.id}`}
                checked={selectedRoleIds.includes(role.id)}
                onCheckedChange={() => toggleRole(role.id)}
              />
              <Label
                htmlFor={`role-assign-${role.id}`}
                className="font-normal"
              >
                {role.display_name}
                {role.description && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {role.description}
                  </span>
                )}
              </Label>
            </div>
          ))
        )}
      </div>

      <DialogFooter>
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
