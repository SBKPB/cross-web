"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MailWarning,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { adminApplicationsApi } from "@/lib/api/admin/applications";
import { lumaPageContainer } from "@/lib/styles/luma";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, FacilityApplication } from "@/types/clinic";

const TABS: { value: ApplicationStatus; label: string }[] = [
  { value: "pending_review", label: "待審核" },
  { value: "pending_verification", label: "待驗證信箱" },
  { value: "approved", label: "已核准" },
  { value: "rejected", label: "已退回" },
];

const STATUS_PILL: Record<ApplicationStatus, string> = {
  pending_review:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  pending_verification: "bg-muted text-muted-foreground",
  approved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-destructive/10 text-destructive",
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending_review: "待審核",
  pending_verification: "待驗證信箱",
  approved: "已核准",
  rejected: "已退回",
};

function fmt(iso: string | null): string {
  return iso ? iso.slice(0, 16).replace("T", " ") : "—";
}

export default function ApplicationsPage() {
  const [tab, setTab] = useState<ApplicationStatus>("pending_review");
  const [rows, setRows] = useState<FacilityApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await adminApplicationsApi.list(tab));
    } catch {
      setError("載入申請清單失敗");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={lumaPageContainer}>
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground before:size-2 before:shrink-0 before:rounded-full before:bg-primary before:content-['']">
          <ClipboardCheck className="size-6" />
          夥伴加入申請
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          申請人完成信箱驗證後才會進入待審核。
          <strong className="font-medium text-foreground">核准時才會建立院所與帳號</strong>
          ，在那之前對方無法登入後台。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={tab === t.value ? "default" : "outline"}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> 載入中…
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-sm text-destructive">{error}</Card>
      ) : rows.length === 0 ? (
        <AdminEmptyState
          icon={tab === "pending_review" ? ClipboardCheck : MailWarning}
          title={`目前沒有${STATUS_LABEL[tab]}的申請`}
          description={
            tab === "pending_verification"
              ? "這些人送出了表單但還沒點驗證信，不需要你處理。"
              : "新的申請完成信箱驗證後會出現在「待審核」。"
          }
        />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <ApplicationCard key={row.id} row={row} onDone={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  row,
  onDone,
}: {
  row: FacilityApplication;
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const reviewable = row.status === "pending_review";

  const act = async (kind: "approve" | "reject") => {
    setBusy(kind);
    setErr(null);
    try {
      if (kind === "approve") {
        await adminApplicationsApi.approve(row.id, note || undefined);
      } else {
        await adminApplicationsApi.reject(row.id, note || undefined);
      }
      onDone();
    } catch {
      setErr(kind === "approve" ? "核准失敗，請稍後再試" : "退回失敗，請稍後再試");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-foreground">{row.business_name}</h2>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                STATUS_PILL[row.status],
              )}
            >
              {STATUS_LABEL[row.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {row.contact_name} · {row.phone} · {row.email}
          </p>
          {(row.city || row.address) && (
            <p className="text-sm text-muted-foreground">
              {row.city} {row.address}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          <div>送出 {fmt(row.created_at)}</div>
          <div>驗證 {fmt(row.verified_at)}</div>
        </div>
      </div>

      {(row.services || row.message) && (
        <div className="mt-4 space-y-1 rounded-2xl bg-muted/30 p-4 text-sm ring-1 ring-foreground/5">
          {row.services && (
            <p className="text-muted-foreground">服務：{row.services}</p>
          )}
          {row.message && (
            <p className="text-muted-foreground">備註：{row.message}</p>
          )}
        </div>
      )}

      {reviewable ? (
        <div className="mt-4 space-y-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="審核附註（退回時建議寫明原因，之後可回頭查）"
            rows={2}
          />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => act("approve")} disabled={busy !== null}>
              {busy === "approve" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              核准並建立帳號
            </Button>
            <Button
              variant="outline"
              onClick={() => act("reject")}
              disabled={busy !== null}
            >
              {busy === "reject" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              退回
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {row.reviewed_at && <span>審核於 {fmt(row.reviewed_at)}</span>}
          {row.review_note && <span>附註：{row.review_note}</span>}
          {row.created_facility_id && (
            <Button asChild size="sm" variant="outline" className="ml-auto">
              <Link href={`/admin/clinics/${row.created_facility_id}`}>
                前往院所
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
