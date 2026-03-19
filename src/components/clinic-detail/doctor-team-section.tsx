"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { User, Users } from "lucide-react";
import type { Member, MemberRole } from "@/types/clinic";
import { cn } from "@/lib/utils";
import { MEMBER_ROLES } from "@/lib/constants/clinic-constants";

interface DoctorTeamSectionProps {
  members: Member[];
  className?: string;
}

// 定義角色分組與顯示順序
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

  // 計算可用的 tab（只顯示有人員的角色分組）
  const availableTabs = useMemo(() => {
    return ROLE_GROUPS.filter((group) => {
      if (group.key === "all") return true;
      return members.some((m) => group.roles.includes(m.role));
    });
  }, [members]);

  // 篩選人員
  const filteredMembers = useMemo(() => {
    if (activeTab === "all") return members;
    const group = ROLE_GROUPS.find((g) => g.key === activeTab);
    if (!group) return members;
    return members.filter((m) => group.roles.includes(m.role));
  }, [members, activeTab]);

  if (members.length === 0) return null;

  return (
    <div className={cn("px-4 sm:px-6", className)}>
      <div className="rounded-2xl border border-n-border bg-n-card p-4 sm:p-5">
        {/* 標題 + 人數 */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-n-brand" />
            <h2 className="text-sm font-semibold text-n-heading">團隊成員</h2>
          </div>
          <span className="text-xs text-n-muted">{members.length} 人</span>
        </div>

        {/* 角色 Tab 切換 */}
        {availableTabs.length > 2 && (
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-n-brand text-white shadow-sm"
                    : "bg-n-section text-n-secondary hover:bg-n-subtle hover:text-n-body"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* 人員卡片 - 橫向滾動 */}
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
          <div className="flex snap-x snap-mandatory gap-3 pb-1">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="w-28 shrink-0 snap-start text-center sm:w-32"
              >
                {/* Avatar */}
                <div className="relative mx-auto size-16 overflow-hidden rounded-full border-2 border-n-border shadow-sm sm:size-18">
                  {member.avatar ? (
                    <Image
                      src={member.avatar}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-n-brand-soft">
                      <User className="size-7 text-n-brand sm:size-8" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="mt-2">
                  <p className="text-sm font-medium text-n-heading">{member.name}</p>
                  <p className="text-xs text-n-secondary">
                    {member.title || MEMBER_ROLES[member.role]}
                  </p>
                  {member.specialties && member.specialties.length > 0 && (
                    <p className="mt-0.5 text-xs text-n-muted line-clamp-1">
                      {member.specialties.slice(0, 2).join("、")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
