"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
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
import { lumaDialogFooter } from "@/lib/styles/luma";
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
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle>角色管理</DialogTitle>
            <DialogDescription>設定使用者的系統角色</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {user && (
        <div className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-semibold uppercase text-primary">
            {user.email.charAt(0)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {user.email}
          </span>
        </div>
      )}

      <div className="space-y-2">
        {allRoles.length === 0 ? (
          <p className="rounded-2xl bg-muted/30 p-4 text-center text-sm text-muted-foreground ring-1 ring-foreground/5">
            尚無可用角色
          </p>
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
                    : "ring-foreground/5 hover:ring-primary/30",
                )}
              >
                <Checkbox
                  id={`role-assign-${role.id}`}
                  checked={checked}
                  onCheckedChange={() => toggleRole(role.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium transition",
                        checked
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {role.display_name}
                    </span>
                  </div>
                  {role.description && (
                    <div className="mt-1.5 text-xs text-muted-foreground">
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
        <Button type="button" onClick={handleConfirm} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
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
