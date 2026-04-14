"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { User, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function DoctorTeamSection({
  members,
  className,
}: DoctorTeamSectionProps) {
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
    <div className={cn("px-4 sm:px-6", className)}>
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="size-4 text-primary" />
              團隊成員
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {members.length} 人
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 角色 Tab 切換 */}
          {availableTabs.length > 2 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {availableTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* 人員卡片 — 橫向滾動 */}
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
            <div className="flex snap-x snap-mandatory gap-4 pb-1">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="w-28 shrink-0 snap-start text-center sm:w-32"
                >
                  {/* Avatar */}
                  <div className="relative mx-auto size-18 overflow-hidden rounded-full ring-1 ring-foreground/5 shadow-sm sm:size-20">
                    {member.avatar ? (
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-accent">
                        <User className="size-8 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-2.5 space-y-0.5">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.title || MEMBER_ROLES[member.role]}
                    </p>
                    {member.specialties && member.specialties.length > 0 && (
                      <p className="line-clamp-1 text-xs text-muted-foreground/80">
                        {member.specialties.slice(0, 2).join("、")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
