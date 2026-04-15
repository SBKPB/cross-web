"use client";

import { GraduationCap, Stethoscope } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { STAFF_ROLES } from "@/lib/constants/clinic-constants";
import { lumaIconBadge } from "@/lib/admin/luma-styles";
import { cn } from "@/lib/utils";
import type { ApiStaff } from "@/types/clinic";

interface StaffDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: ApiStaff | null;
}

interface SectionProps {
  label: string;
  items?: string[] | null;
  empty?: string;
}

function Section({ label, items, empty = "未填寫" }: SectionProps) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {items && items.length > 0 ? (
        <ul className="space-y-1 text-sm text-foreground">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              · {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

export function StaffDetailDialog({
  open,
  onOpenChange,
  staff,
}: StaffDetailDialogProps) {
  if (!staff) return null;

  const roleLabel = STAFF_ROLES[staff.role] || staff.role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-3xl bg-muted ring-1 ring-foreground/5">
              {staff.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={staff.avatar_url}
                  alt={staff.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className={cn(lumaIconBadge, "size-full rounded-none")}>
                  <Stethoscope className="size-7" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle className="text-xl">{staff.name}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{roleLabel}</Badge>
                {staff.department && (
                  <span className="text-muted-foreground">
                    · {staff.department}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* 專長 */}
          <Section label="專長" items={staff.main_specialties} />

          {/* 學歷 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <GraduationCap className="size-3.5" />
              學歷
            </div>
            {staff.education && staff.education.length > 0 ? (
              <ul className="space-y-1 text-sm text-foreground">
                {staff.education.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    · {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">未填寫</p>
            )}
          </div>

          {/* 經歷 */}
          <Section label="經歷" items={staff.experience} />

          {/* 證照（可選） */}
          {staff.license_number && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                執照資訊
              </div>
              <div className="space-y-0.5 text-sm text-foreground">
                {staff.license_type && (
                  <div>
                    <span className="text-muted-foreground">類別：</span>
                    {staff.license_type}
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">字號：</span>
                  {staff.license_number}
                </div>
                {staff.nhi_provider_id && (
                  <div>
                    <span className="text-muted-foreground">健保特約：</span>
                    {staff.nhi_provider_id}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 聯絡資訊 */}
          {(staff.phone || staff.email) && (
            <div className="space-y-1.5 border-t border-border/60 pt-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                聯絡方式
              </div>
              <div className="space-y-0.5 text-sm text-foreground">
                {staff.phone && (
                  <div>
                    <span className="text-muted-foreground">電話：</span>
                    {staff.phone}
                  </div>
                )}
                {staff.email && (
                  <div>
                    <span className="text-muted-foreground">Email：</span>
                    {staff.email}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
