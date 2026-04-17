"use client";

import { useCallback, useEffect, useState } from "react";
import { LogIn, PlusIcon, UserCheck } from "lucide-react";
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
import { IDENTIFIER_TYPE_LABELS } from "@/lib/constants/patient-constants";
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
  const { user, isAuthenticated, isLoading: authLoading, loginWithGoogle } =
    useAuth();
  const [patients, setPatients] = useState<MemberPatientRead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await memberPatientApi.list();
      setPatients(data);

      // 如果 selectedId 為空，預設選 last_booked 或第一位
      if (!selectedId && data.length > 0) {
        const lastBooked = user?.last_booked_member_patient_id;
        const defaultPatient =
          data.find((p) => p.id === lastBooked) || data[0];
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

  const handleCreated = (newPatient: MemberPatientRead) => {
    setPatients((prev) => [...prev, newPatient]);
    onSelect(newPatient);
    setDialogOpen(false);
  };

  // ─── 未登入：顯示 inline 登入 ───
  if (!authLoading && !isAuthenticated) {
    return (
      <div className={className}>
        <Card className="space-y-4 p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
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
              onClick={() =>
                setLoginError("Apple 登入尚未設定，請使用 Google 登入")
              }
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
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <UserCheck className="size-4 text-primary" />
          看診對象
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <PlusIcon className="mr-1.5 size-3.5" />
          新增
        </Button>
      </div>

      {patients.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            請先新增看診對象才能預約
          </p>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <PlusIcon className="mr-1.5 size-3.5" />
            新增看診對象
          </Button>
        </Card>
      ) : (
        <RadioGroup
          value={selectedId || ""}
          onValueChange={(id) => {
            const p = patients.find((pt) => pt.id === id);
            if (p) onSelect(p);
          }}
          className="space-y-2"
        >
          {patients.map((patient) => {
            const isSelected = patient.id === selectedId;
            return (
              <label
                key={patient.id}
                htmlFor={`patient-${patient.id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl p-4 ring-1 transition",
                  isSelected
                    ? "bg-primary/5 ring-primary"
                    : "ring-foreground/5 hover:ring-primary/20",
                )}
              >
                <RadioGroupItem
                  value={patient.id}
                  id={`patient-${patient.id}`}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {patient.name}
                    </span>
                    {patient.relation !== "self" && (
                      <span className="text-xs text-muted-foreground">
                        （{patient.relation === "spouse"
                          ? "配偶"
                          : patient.relation === "child"
                            ? "子女"
                            : patient.relation === "parent"
                              ? "父母"
                              : "其他"}
                        ）
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {IDENTIFIER_TYPE_LABELS[patient.identifier_type as IdentifierType]}
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
      )}

      <NewPatientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
