"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, UserRound } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { cn } from "@/lib/utils";
import type { ApiPatientListItem } from "@/types/clinic";
import { PatientDetailDialog } from "./patient-detail-dialog";

const GENDER_LABELS = { M: "男", F: "女" } as const;

/** 由生日推年齡（只到「歲」；櫃檯核對身分用，不需精算） */
export function ageFrom(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate + "T00:00:00");
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export function formatPatientDate(value: string | null): string {
  return value ? value.replaceAll("-", "/") : "—";
}

interface PatientsTabProps {
  facilityId: string;
}

export function PatientsTab({ facilityId }: PatientsTabProps) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [patients, setPatients] = useState<ApiPatientListItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 打字防抖，避免每個字元打一次 API
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminClinicsApi.patients.list(facilityId, {
        q: query || undefined,
        include_inactive: includeInactive,
      });
      setPatients(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      setError("無法載入患者名單，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, query, includeInactive]);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋姓名 / 電話 / 身分證"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="include-inactive"
            checked={includeInactive}
            onCheckedChange={(v) => setIncludeInactive(v === true)}
          />
          <Label
            htmlFor="include-inactive"
            className="text-sm font-normal text-muted-foreground"
          >
            含停用
          </Label>
        </div>
        {patients && (
          <p className="ml-auto text-xs text-muted-foreground">
            共 {patients.length} 位 · 依最近就診排序
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : !patients || patients.length === 0 ? (
        <AdminEmptyState
          icon={UserRound}
          title={query ? "找不到符合的患者" : "尚無患者資料"}
          description={
            query
              ? "換個關鍵字試試，或清空搜尋看全部"
              : "患者會在第一次預約（線上或櫃檯代訂）時自動建立"
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5">
          <Table>
            <TableHeader className="bg-muted/40 [&_th]:font-medium [&_th]:text-muted-foreground">
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>電話</TableHead>
                <TableHead>身分證</TableHead>
                <TableHead className="text-right">就診</TableHead>
                <TableHead className="text-right">未到</TableHead>
                <TableHead>最近就診</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="cursor-pointer transition hover:bg-muted/30"
                >
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                        {p.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{p.name}</span>
                          {p.member_linked && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              會員
                            </span>
                          )}
                          {!p.is_active && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              停用
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[
                            p.gender ? GENDER_LABELS[p.gender] : null,
                            ageFrom(p.birth_date) !== null
                              ? `${ageFrom(p.birth_date)} 歲`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{p.phone || "—"}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {p.national_id_last4 ? `••••••${p.national_id_last4}` : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.appointment_count}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      p.no_show_count > 0 && "text-amber-700 dark:text-amber-400",
                    )}
                  >
                    {p.no_show_count}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatPatientDate(p.last_visit_date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PatientDetailDialog
        facilityId={facilityId}
        patientId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onSaved={fetchPatients}
      />
    </div>
  );
}
