"use client";

import { useMemo, useState } from "react";
import { User, Users } from "lucide-react";

import { SectionCard } from "@/components/clinic-detail/section-card";
import { MEMBER_ROLES } from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { Member, MemberRole } from "@/types/clinic";

interface DoctorTeamSectionProps {
  members: Member[];
  className?: string;
}

const ROLE_GROUPS: { key: "all" | MemberRole; label: string; roles: MemberRole[] }[] = [
  { key: "all", label: "全部", roles: [] },
  { key: "doctor", label: "醫師", roles: ["doctor", "therapist"] },
  { key: "nurse", label: "護理", roles: ["nurse"] },
  { key: "beautician", label: "美容", roles: ["beautician"] },
  { key: "admin", label: "行政", roles: ["receptionist", "admin"] },
];

export function DoctorTeamSection({ members, className }: DoctorTeamSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const availableTabs = useMemo(
    () =>
      ROLE_GROUPS.filter((group) => {
        if (group.key === "all") return true;
        return members.some((m) => group.roles.includes(m.role));
      }),
    [members],
  );

  const filteredMembers = useMemo(() => {
    if (activeTab === "all") return members;
    const group = ROLE_GROUPS.find((g) => g.key === activeTab);
    if (!group) return members;
    return members.filter((m) => group.roles.includes(m.role));
  }, [members, activeTab]);

  if (members.length === 0) return null;

  return (
    <SectionCard
      icon={Users}
      title="團隊成員"
      action={
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {members.length} 人
        </span>
      }
      className={className}
    >
      {availableTabs.length > 2 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="flex flex-col items-center rounded-2xl bg-muted/40 p-4 text-center ring-1 ring-transparent transition-all hover:bg-accent/40 hover:ring-primary/15"
          >
            <div className="relative size-16 overflow-hidden rounded-full shadow-sm ring-2 ring-card">
              {member.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatar}
                  alt={member.name}
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-sky-200/50">
                  <User className="size-7 text-primary" />
                </div>
              )}
            </div>
            <p className="mt-3 truncate text-sm font-semibold text-foreground">
              {member.name}
            </p>
            <p className="text-xs text-primary">
              {member.title || MEMBER_ROLES[member.role]}
            </p>
            {member.specialties && member.specialties.length > 0 && (
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {member.specialties.slice(0, 2).join("、")}
              </p>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
