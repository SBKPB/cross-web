"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Loader2,
  MapPin,
  NotebookPen,
  Phone,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/constants/appointment";
import { lumaDialogFooter } from "@/lib/styles/luma";
import { cn } from "@/lib/utils";
import type {
  ApiPatientDetail,
  ApiPatientTimelineItem,
  AppointmentStatus,
} from "@/types/clinic";
import { ageFrom, formatPatientDate } from "./patients-tab";

const STATUS_PILL: Record<AppointmentStatus, string> = {
  confirmed: "bg-primary/10 text-primary",
  checked_in: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  in_progress:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

// 時間軸圓點色（與狀態徽章同語意，但要在淺色背景上看得見）
const STATUS_DOT: Record<AppointmentStatus, string> = {
  confirmed: "bg-primary",
  checked_in: "bg-teal-500",
  in_progress: "bg-indigo-500",
  completed: "bg-green-500",
  cancelled: "bg-muted-foreground/40",
  no_show: "bg-amber-500",
};

const METHOD_LABELS: Record<string, string> = {
  phone: "電話",
  walk_in: "現場",
  online: "線上",
};

const GENDER_LABELS = { M: "男", F: "女" } as const;

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : new Intl.DateTimeFormat("zh-TW", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Taipei",
      }).format(d);
}

interface PatientDetailDialogProps {
  facilityId: string;
  patientId: string | null;
  onOpenChange: (open: boolean) => void;
  /** 存檔後讓清單重抓（電話 / 停用狀態會變） */
  onSaved?: () => void;
}

export function PatientDetailDialog({
  facilityId,
  patientId,
  onOpenChange,
  onSaved,
}: PatientDetailDialogProps) {
  const [patient, setPatient] = useState<ApiPatientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    address: "",
    emergency_contact: "",
    allergy_info: "",
    medical_history: "",
  });

  const load = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setIsEditing(false);
    try {
      const data = await adminClinicsApi.patients.get(facilityId, patientId);
      setPatient(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch patient:", err);
      setError("無法載入患者檔案，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, patientId]);

  useEffect(() => {
    if (patientId) void load();
    else setPatient(null);
  }, [patientId, load]);

  function startEdit() {
    if (!patient) return;
    setForm({
      phone: patient.phone ?? "",
      address: patient.address ?? "",
      emergency_contact: patient.emergency_contact ?? "",
      allergy_info: patient.allergy_info ?? "",
      medical_history: patient.medical_history ?? "",
    });
    setIsEditing(true);
  }

  async function handleSave() {
    if (!patientId) return;
    setIsSaving(true);
    try {
      const updated = await adminClinicsApi.patients.update(facilityId, patientId, {
        phone: form.phone.trim(),
        address: form.address.trim() || null,
        emergency_contact: form.emergency_contact.trim() || null,
        allergy_info: form.allergy_info.trim() || null,
        medical_history: form.medical_history.trim() || null,
      });
      setPatient(updated);
      setIsEditing(false);
      setError(null);
      onSaved?.();
    } catch (err) {
      console.error("Failed to update patient:", err);
      setError("儲存失敗，請確認你有院所管理權限後再試");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={!!patientId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {isLoading || !patient ? (
          <>
            <DialogHeader>
              <DialogTitle>患者檔案</DialogTitle>
              <DialogDescription>載入中…</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-16">
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <Loader2 className="size-7 animate-spin text-primary" />
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4">
                <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-primary/10 text-2xl font-semibold text-primary">
                  {patient.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <DialogTitle className="text-xl">{patient.name}</DialogTitle>
                  <DialogDescription asChild>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill icon={UserRound}>
                        {[
                          patient.gender ? GENDER_LABELS[patient.gender] : null,
                          ageFrom(patient.birth_date) !== null
                            ? `${ageFrom(patient.birth_date)} 歲`
                            : null,
                          patient.national_id_last4
                            ? `••••••${patient.national_id_last4}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "資料未填"}
                      </Pill>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          patient.member_linked
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {patient.member_linked ? "已綁會員" : "現場客"}
                      </span>
                      {!patient.is_active && (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          停用
                        </span>
                      )}
                    </div>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {error && (
              <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
                {error}
              </div>
            )}

            {/* 就診彙總 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="總預約" value={patient.stats.total} />
              <Stat label="已完成" value={patient.stats.completed} />
              <Stat
                label="未到診"
                value={patient.stats.no_show}
                hint={
                  patient.stats.completed + patient.stats.no_show > 0
                    ? `未到率 ${Math.round(patient.stats.no_show_rate * 100)}%`
                    : undefined
                }
                warn={patient.stats.no_show > 0}
              />
              <Stat label="未來預約" value={patient.stats.upcoming} />
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <Fact icon={CalendarClock} label="首次就診">
                {formatPatientDate(patient.stats.first_visit)}
              </Fact>
              <Fact icon={CalendarClock} label="最近就診">
                {formatPatientDate(patient.stats.last_visit)}
              </Fact>
              <Fact icon={Stethoscope} label="最常看診">
                {patient.stats.top_staff_name ?? "—"}
              </Fact>
              <Fact icon={Stethoscope} label="指定醫師">
                {patient.preferred_staff_name ?? "—"}
              </Fact>
            </div>

            {/* 聯絡與註記 */}
            <div className="space-y-3 rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <NotebookPen className="size-3.5" />
                  聯絡與註記
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={startEdit}>
                    編輯
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <Field label="電話">
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      maxLength={15}
                    />
                  </Field>
                  <Field label="地址">
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      maxLength={200}
                    />
                  </Field>
                  <Field label="緊急聯絡人">
                    <Input
                      value={form.emergency_contact}
                      onChange={(e) =>
                        setForm({ ...form, emergency_contact: e.target.value })
                      }
                      maxLength={100}
                      placeholder="姓名／關係／電話"
                    />
                  </Field>
                  <Field label="過敏">
                    <Textarea
                      value={form.allergy_info}
                      onChange={(e) =>
                        setForm({ ...form, allergy_info: e.target.value })
                      }
                      placeholder="藥物、食物過敏史"
                    />
                  </Field>
                  <Field label="病史">
                    <Textarea
                      value={form.medical_history}
                      onChange={(e) =>
                        setForm({ ...form, medical_history: e.target.value })
                      }
                      placeholder="慢性病、手術史、用藥"
                    />
                  </Field>
                  <div className={cn("flex", lumaDialogFooter)}>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      取消
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving && <Loader2 className="size-4 animate-spin" />}
                      儲存
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <Fact icon={Phone} label="電話">
                    {patient.phone || "—"}
                  </Fact>
                  <Fact icon={MapPin} label="地址">
                    {patient.address || "—"}
                  </Fact>
                  <Fact icon={UserRound} label="緊急聯絡人">
                    {patient.emergency_contact || "—"}
                  </Fact>
                  <Note
                    label="過敏"
                    value={patient.allergy_info}
                    highlight
                    empty="未記錄"
                  />
                  <Note label="病史" value={patient.medical_history} empty="未記錄" />
                </div>
              )}
            </div>

            {/* 就診時間軸 */}
            <div className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                就診時間軸（{patient.timeline.length}）
              </div>
              {patient.timeline.length === 0 ? (
                <p className="rounded-2xl bg-muted/30 p-4 text-sm text-muted-foreground ring-1 ring-foreground/5">
                  尚無就診紀錄
                </p>
              ) : (
                <ol className="relative space-y-4 border-l border-foreground/10 pl-6">
                  {patient.timeline.map((item) => (
                    <TimelineRow key={item.appointment_id} item={item} />
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TimelineRow({ item }: { item: ApiPatientTimelineItem }) {
  return (
    <li className="relative">
      <span
        className={cn(
          "absolute -left-[1.9rem] top-1.5 size-3 rounded-full ring-4 ring-background",
          STATUS_DOT[item.status],
        )}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium tabular-nums text-foreground">
          {item.appointment_date.replaceAll("-", "/")} {item.appointment_time.slice(0, 5)}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            STATUS_PILL[item.status],
          )}
        >
          {APPOINTMENT_STATUS_LABELS[item.status]}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {METHOD_LABELS[item.booking_method] ?? item.booking_method}
        </span>
        {item.queue_number !== null && (
          <span className="text-xs tabular-nums text-muted-foreground">
            #{item.queue_number}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {[item.staff_name, item.service_name].filter(Boolean).join(" · ") ||
          "未指定醫師"}
      </p>
      {item.notes && (
        <p className="mt-1 rounded-xl bg-muted/40 px-3 py-2 text-xs text-foreground">
          {item.notes}
        </p>
      )}
      {item.events.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {item.events.map((e, i) => (
            <li
              key={i}
              className="text-xs text-muted-foreground"
            >
              <span className="tabular-nums">{formatDateTime(e.created_at)}</span>
              {" · "}
              {APPOINTMENT_STATUS_LABELS[e.from_status]} →{" "}
              {APPOINTMENT_STATUS_LABELS[e.to_status]}
              {e.reason ? `（${e.reason}）` : ""}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Pill({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: number;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-2xl font-bold tabular-nums tracking-tight",
          warn ? "text-amber-700 dark:text-amber-400" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}：</span>
      <span className="min-w-0 truncate text-foreground">{children}</span>
    </div>
  );
}

function Note({
  label,
  value,
  empty,
  highlight,
}: {
  label: string;
  value: string | null;
  empty: string;
  highlight?: boolean;
}) {
  const filled = !!value?.trim();
  return (
    <div className="flex items-start gap-2">
      <AlertTriangle
        className={cn(
          "mt-0.5 size-3.5 shrink-0",
          highlight && filled ? "text-amber-600" : "text-muted-foreground",
        )}
      />
      <span className="shrink-0 text-muted-foreground">{label}：</span>
      <span
        className={cn(
          "min-w-0 flex-1 whitespace-pre-wrap",
          filled
            ? highlight
              ? "font-medium text-amber-700 dark:text-amber-400"
              : "text-foreground"
            : "text-muted-foreground",
        )}
      >
        {filled ? value : empty}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
