"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Loader2,
  Search as SearchIcon,
  Calendar,
  BarChart3,
  Shield,
} from "lucide-react";

import { ClinicList } from "@/components/clinics/clinic-list";
import { ClinicToolbar } from "@/components/clinics/clinic-toolbar";
import { clinicsApi } from "@/lib/api/clinics";
import type { Clinic, ClinicFilters } from "@/types/clinic";

const FEATURES = [
  {
    icon: SearchIcon,
    title: "智能搜尋",
    desc: "跨科別、跨區域快速找到最適合的醫療院所",
  },
  {
    icon: Calendar,
    title: "線上預約",
    desc: "即時查看門診時段，一鍵完成預約掛號",
  },
  {
    icon: BarChart3,
    title: "數據洞察",
    desc: "視覺化醫療數據分析，掌握院所營運狀態",
  },
  {
    icon: Shield,
    title: "安全可靠",
    desc: "醫療級資安防護，保障患者隱私資料安全",
  },
];

export default function Home() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ClinicFilters>({
    search: "",
    hospitalLevel: "all",
    department: "all",
  });

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const data = await clinicsApi.getClinics();
        setClinics(data);
      } catch (error) {
        console.error("[Home] Failed to fetch clinics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClinics();
  }, []);

  const filteredClinics = useMemo(() => {
    return clinics.filter((clinic: Clinic) => {
      if (
        filters.search &&
        !clinic.clinic_name
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.hospitalLevel !== "all" &&
        clinic.hospital_level !== filters.hospitalLevel
      ) {
        return false;
      }
      if (
        filters.department !== "all" &&
        !clinic.departments.includes(filters.department)
      ) {
        return false;
      }
      return true;
    });
  }, [clinics, filters]);

  const stats = [
    { value: clinics.length > 0 ? `${clinics.length}+` : "—", label: "合作院所" },
    { value: "18", label: "醫療科別" },
    { value: "24/7", label: "全天候服務" },
    { value: "99.8%", label: "用戶滿意度" },
  ];

  return (
    <div className="min-h-screen bg-n-main">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-n-border bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-n-brand flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-n-heading tracking-tight">
              Cross
            </span>
          </Link>
        </div>
      </header>

      {/* ── Hero（含搜尋列 + 迷你統計） ── */}
      <section className="bg-gradient-to-b from-n-brand-soft/40 via-n-main to-n-main">
        <div className="container mx-auto px-4 pt-14 sm:pt-20">
          {/* 標題區 */}
          <div
            className="max-w-2xl mx-auto text-center mb-8"
            style={{ animation: "fadeInUp 0.7s ease-out both" }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-n-heading tracking-tight leading-[1.15] mb-4">
              找到最適合的
              <span className="text-n-brand">醫療院所</span>
            </h1>
            <p className="text-base text-n-secondary max-w-lg mx-auto leading-relaxed">
              搜尋全台醫療院所，線上預約掛號，一站完成
            </p>
          </div>

          {/* 迷你統計 */}
          <div
            className="flex justify-center gap-6 sm:gap-10 mb-6 text-center"
            style={{ animation: "fadeInUp 0.5s ease-out 0.1s both" }}
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-lg sm:text-xl font-bold text-n-brand">{stat.value}</div>
                <div className="text-xs text-n-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 搜尋列（sticky） + 院所列表 ── */}
      <section className="bg-n-main pb-16">
        <div className="container mx-auto px-4">
          {/* 搜尋列：滾動時 sticky 在 header 下方 */}
          <div className="sticky top-[65px] z-10 py-3 -mt-1 bg-n-main/80 backdrop-blur-lg">
            <ClinicToolbar filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* 結果計數 */}
          <div className="text-sm text-n-secondary mb-4 mt-1">
            {isLoading ? "載入中..." : `共 ${filteredClinics.length} 間院所`}
          </div>

          {/* Clinic List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-n-brand" />
            </div>
          ) : (
            <ClinicList clinics={filteredClinics} />
          )}
        </div>
      </section>

      {/* ── Features（品牌背書） ── */}
      <section className="bg-n-section border-t border-n-border py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-n-heading mb-3">
              為什麼選擇 Cross
            </h2>
            <p className="text-n-secondary text-sm sm:text-base">
              全方位醫療管理解決方案
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-6 bg-white border border-n-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-n-border-focus hover:-translate-y-0.5"
              >
                <div className="w-10 h-10 rounded-lg bg-n-brand-soft flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-n-brand" />
                </div>
                <h3 className="text-n-heading font-semibold mb-2">{f.title}</h3>
                <p className="text-n-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-n-border bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-n-brand" />
              <span className="font-semibold text-n-heading text-sm">Cross</span>
            </Link>
            <p className="text-xs text-n-muted">
              &copy; 2025 Cross Healthcare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
