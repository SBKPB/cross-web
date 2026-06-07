"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LogIn, PlusIcon, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth/auth-context";
import { memberPatientApi } from "@/lib/api/member-patient";
import type { MemberPatientRead } from "@/types/member-patient";
import { NewPatientDialog } from "@/components/patient/new-patient-dialog";
import {
  GoogleSignInButton,
  AppleSignInButton,
} from "@/components/auth/social-login-buttons";
import { cn } from "@/lib/utils";
import {
  IDENTIFIER_TYPE_LABELS,
  RELATION_LABELS,
} from "@/lib/constants/patient-constants";
import type { IdentifierType } from "@/types/member-patient";

interface PatientSelectorProps {
  selectedId: string | null;
  onSelect: (patient: MemberPatientRead) => void;
  className?: string;
}

export function PatientSelector({
  selectedId,
  onSelect,
  className,
}: PatientSelectorProps) {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    loginWithGoogle,
    loginWithApple,
  } = useAuth();
  const [patients, setPatients] = useState<MemberPatientRead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  // 對話框預設關係：「為本人預約」帶 self，其餘帶 other
  const [dialogRelation, setDialogRelation] = useState("other");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 會員 profile 名稱，用於本人引導預填
  const memberName = user?.display_name ?? "";

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await memberPatientApi.list();
      setPatients(data);

      // 如果 selectedId 為空，預設選 last_booked，否則本人（self），最後退回第一位
      if (!selectedId && data.length > 0) {
        const lastBooked = user?.last_booked_member_patient_id;
        const defaultPatient =
          data.find((p) => p.id === lastBooked) ||
          data.find((p) => p.relation === "self") ||
          data[0];
        onSelect(defaultPatient);
      }
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, user?.last_booked_member_patient_id, onSelect]);

  // 登入後自動載入 patients
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      fetchPatients();
    }
  }, [authLoading, isAuthenticated, fetchPatients]);

  // 本人優先排在最前
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      if (a.relation === "self" && b.relation !== "self") return -1;
      if (a.relation !== "self" && b.relation === "self") return 1;
      return 0;
    });
  }, [patients]);

  const handleGoogleLogin = async (idToken: string) => {
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await loginWithGoogle(idToken);
      // auth state 更新後 useEffect 會自動 fetchPatients
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "登入失敗，請稍後再試",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAppleLogin = async (idToken: string, userName?: string) => {
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await loginWithApple(idToken, userName);
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "登入失敗，請稍後再試",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const openDialog = (relation: string) => {
    setDialogRelation(relation);
    setDialogOpen(true);
  };

  const handleCreated = (newPatient: MemberPatientRead) => {
    setPatients((prev) => [...prev, newPatient]);
    onSelect(newPatient);
    setDialogOpen(false);
  };

  // ─── 未登入：顯示 inline 登入 ───
  if (!authLoading && !isAuthenticated) {
    return (
      <div className={className}>
        <Card className="items-center gap-4 p-6 text-center" size="sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LogIn className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              登入後即可預約
            </p>
            <p className="text-sm text-muted-foreground">
              登入以選擇看診對象並完成預約
            </p>
          </div>

          {loginError && (
            <p className="text-xs text-destructive">{loginError}</p>
          )}

          <div className="mx-auto w-full max-w-xs space-y-3">
            <GoogleSignInButton
              onSuccess={handleGoogleLogin}
              onError={() => setLoginError("Google 登入失敗")}
              disabled={isLoggingIn}
            />
            <AppleSignInButton
              onSuccess={handleAppleLogin}
              onError={(msg) => setLoginError(msg ?? "Apple 登入失敗")}
              disabled={isLoggingIn}
            />
          </div>

          {isLoggingIn && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="size-3 animate-spin rounded-full border-2 border-muted border-t-primary" />
              登入中...
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ─── Loading ───
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  // ─── 已登入：顯示看診對象列表 ───
  return (
    <div className={className}>
      {patients.length === 0 ? (
        // ── 空狀態：高亮「為本人預約」CTA + 次要「新增其他家人」 ──
        <div className="rounded-3xl bg-card p-6 text-center shadow-sm ring-1 ring-foreground/5 sm:p-7">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserCheck className="size-7" />
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">
            這是您本人要看診嗎？
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            一次填好本人就診資料，之後預約自動帶入
          </p>

          <Button
            type="button"
            size="lg"
            className="mt-5 w-full rounded-2xl font-semibold shadow-sm shadow-primary/20"
            onClick={() => openDialog("self")}
          >
            <UserCheck className="size-5" />
            為本人預約
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full rounded-2xl text-muted-foreground hover:text-foreground"
            onClick={() => openDialog("other")}
          >
            <UserPlus className="size-4" />
            為其他家人預約
          </Button>
        </div>
      ) : (
        // ── 已有看診對象：清單 ──
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserCheck className="size-4" />
              </span>
              看診對象
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => openDialog("other")}
            >
              <PlusIcon className="size-3.5" />
              新增
            </Button>
          </div>

          <RadioGroup
            value={selectedId || ""}
            onValueChange={(id) => {
              const p = patients.find((pt) => pt.id === id);
              if (p) onSelect(p);
            }}
            className="space-y-2.5"
          >
            {sortedPatients.map((patient) => {
              const isSelected = patient.id === selectedId;
              const isSelf = patient.relation === "self";
              return (
                <label
                  key={patient.id}
                  htmlFor={`patient-${patient.id}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl bg-card p-4 ring-1 transition-all",
                    isSelected
                      ? "bg-primary/5 ring-2 ring-primary shadow-sm shadow-primary/10"
                      : "ring-foreground/5 hover:ring-primary/30 hover:shadow-sm",
                  )}
                >
                  <RadioGroupItem
                    value={patient.id}
                    id={`patient-${patient.id}`}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {patient.name}
                      </span>
                      {isSelf ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          本人
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {RELATION_LABELS[patient.relation] ?? "其他"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {
                        IDENTIFIER_TYPE_LABELS[
                          patient.identifier_type as IdentifierType
                        ]
                      }
                      {" ****"}
                      {patient.identifier_last4}
                      {" · "}
                      {patient.birth_date}
                      {" · "}
                      {patient.gender === "M" ? "男" : "女"}
                    </div>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        </div>
      )}

      <NewPatientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCreated}
        defaultRelation={dialogRelation}
        defaultName={dialogRelation === "self" ? memberName : ""}
      />
    </div>
  );
}
