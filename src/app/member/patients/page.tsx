"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PlusIcon,
  Trash2Icon,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRequireMember } from "@/lib/auth/use-require-member";
import { memberPatientApi } from "@/lib/api/member-patient";
import type { MemberPatientRead } from "@/types/member-patient";
import { NewPatientDialog } from "@/components/patient/new-patient-dialog";
import {
  IDENTIFIER_TYPE_LABELS,
  RELATION_LABELS,
} from "@/lib/constants/patient-constants";
import type { IdentifierType } from "@/types/member-patient";

export default function MemberPatientsPage() {
  // 守衛：未登入導向登入頁，後台帳號導回後台，不渲染民眾端內容
  const { ready } = useRequireMember("/member/patients");
  const [patients, setPatients] = useState<MemberPatientRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MemberPatientRead | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await memberPatientApi.list();
      setPatients(data);
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    fetchPatients();
  }, [ready, fetchPatients]);

  const handleCreated = (newPatient: MemberPatientRead) => {
    setPatients((prev) => [...prev, newPatient]);
    setCreateOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await memberPatientApi.delete(deleteTarget.id);
      setPatients((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete patient:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/member"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 size-4" />
              返回
            </Link>
            <h1 className="text-lg font-bold text-foreground">看診對象管理</h1>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="mr-1.5 size-3.5" />
            新增
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-3 px-4 py-6 sm:px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        ) : patients.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <UserCheck className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              尚無看診對象，請先新增
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="mr-1.5 size-3.5" />
              新增看診對象
            </Button>
          </Card>
        ) : (
          patients.map((patient) => (
            <Card
              key={patient.id}
              className="p-5 ring-1 ring-foreground/5 transition hover:ring-primary/15"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-base font-semibold text-primary">
                  {patient.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {patient.name}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {RELATION_LABELS[patient.relation] || patient.relation}
                    </span>
                  </div>
                  <div className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {IDENTIFIER_TYPE_LABELS[patient.identifier_type as IdentifierType]}{" "}
                    ****{patient.identifier_last4}
                    {" · "}
                    {patient.birth_date}
                    {" · "}
                    {patient.gender === "M" ? "男" : "女"}
                  </div>
                  {patient.phone && (
                    <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      {patient.phone}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(patient)}
                  title="刪除"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <NewPatientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      {/* 刪除確認 */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除「{deleteTarget?.name}」嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "刪除中..." : "確認刪除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
