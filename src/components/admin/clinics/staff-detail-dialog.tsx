"use client";

import {
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Mail,
  Phone,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STAFF_ROLES } from "@/lib/constants/clinic-constants";
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
    <div className="space-y-2 rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {items && items.length > 0 ? (
        <ul className="space-y-1.5 text-sm text-foreground">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 leading-relaxed">
              <span
                aria-hidden
                className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/50"
              />
              <span className="min-w-0 flex-1">{item}</span>
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
            <div className="size-20 shrink-0 overflow-hidden rounded-3xl bg-primary/10 ring-1 ring-foreground/5">
              {staff.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={staff.avatar_url}
                  alt={staff.name}
                  className="size-full object-cover"
                />
              ) : (
                <span className="grid size-full place-items-center text-2xl font-semibold text-primary">
                  {staff.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <DialogTitle className="text-xl">{staff.name}</DialogTitle>
              <DialogDescription asChild>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <Stethoscope className="size-3.5" />
                    {roleLabel}
                  </span>
                  {staff.department && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {staff.department}
                    </span>
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                      staff.is_public_visible
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {staff.is_public_visible ? (
                      <Eye className="size-3.5" />
                    ) : (
                      <EyeOff className="size-3.5" />
                    )}
                    {staff.is_public_visible ? "公開顯示" : "不公開"}
                  </span>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {/* 專長 */}
          <Section label="專長" items={staff.main_specialties} />

          {/* 學歷 */}
          <div className="space-y-2 rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <GraduationCap className="size-3.5" />
              學歷
            </div>
            {staff.education && staff.education.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-foreground">
                {staff.education.map((item, idx) => (
                  <li key={idx} className="flex gap-2 leading-relaxed">
                    <span
                      aria-hidden
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/50"
                    />
                    <span className="min-w-0 flex-1">{item}</span>
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
            <div className="space-y-2 rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <IdCard className="size-3.5" />
                執照資訊
              </div>
              <div className="space-y-1 text-sm text-foreground">
                {staff.license_type && (
                  <div>
                    <span className="text-muted-foreground">類別：</span>
                    {staff.license_type}
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">字號：</span>
                  <span className="tabular-nums">{staff.license_number}</span>
                </div>
                {staff.nhi_provider_id && (
                  <div>
                    <span className="text-muted-foreground">健保特約：</span>
                    <span className="tabular-nums">{staff.nhi_provider_id}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 聯絡資訊 */}
          {(staff.phone || staff.email) && (
            <div className="space-y-2 rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="size-3.5" />
                聯絡方式
              </div>
              <div className="space-y-1 text-sm text-foreground">
                {staff.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="tabular-nums">{staff.phone}</span>
                  </div>
                )}
                {staff.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 truncate">{staff.email}</span>
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
