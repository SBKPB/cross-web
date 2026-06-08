"use client";

import { GraduationCap, Briefcase, Stethoscope, User } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MEMBER_ROLES } from "@/lib/constants/clinic-constants";
import type { ClinicDoctorDetail, Member } from "@/types/clinic";

interface DoctorDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  detail?: ClinicDoctorDetail;
}

export function DoctorDetailDialog({
  open,
  onOpenChange,
  member,
  detail,
}: DoctorDetailDialogProps) {
  if (!member) return null;

  const avatar = detail?.avatar ?? member.avatar;
  const specialties =
    detail?.specialties && detail.specialties.length > 0
      ? detail.specialties
      : (member.specialties ?? []);
  const education = detail?.education ?? [];
  const experience = detail?.experience ?? [];
  const roleLabel = member.title || MEMBER_ROLES[member.role];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">{member.name} 詳細資料</DialogTitle>
        </DialogHeader>

        {/* 頭部：頭像 + 姓名 + 職稱/科別 */}
        <div className="flex flex-col items-center text-center">
          <div className="size-24 overflow-hidden rounded-full shadow-sm ring-4 ring-card">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={member.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-sky-200/50">
                <User className="size-10 text-primary" />
              </div>
            )}
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">
            {member.name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-sm font-medium text-primary">{roleLabel}</span>
            {detail?.department && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {detail.department}
              </span>
            )}
            {detail?.license_type && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {detail.license_type}
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 space-y-5">
          {/* 專長 */}
          {specialties.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Stethoscope className="size-4 text-primary" />
                專長
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {specialties.map((s) => (
                  <Badge key={s} variant="secondary" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* 學歷 */}
          {education.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <GraduationCap className="size-4 text-primary" />
                學歷
              </h3>
              <ul className="space-y-1.5">
                {education.map((e) => (
                  <li
                    key={e}
                    className="flex gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/40" />
                    {e}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 經歷 */}
          {experience.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Briefcase className="size-4 text-primary" />
                經歷
              </h3>
              <ul className="space-y-1.5">
                {experience.map((e) => (
                  <li
                    key={e}
                    className="flex gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/40" />
                    {e}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {specialties.length === 0 &&
            education.length === 0 &&
            experience.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                尚無更多公開資料
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
