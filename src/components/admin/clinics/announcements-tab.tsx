"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2, Megaphone, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types/clinic";

const MAX_ACTIVE = 3;

// 從 ApiError 取後端的 detail 訊息（例如「公告最多 3 則…」）
function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "data" in e) {
    const detail = (e as { data?: { detail?: unknown } }).data?.detail;
    if (typeof detail === "string") return detail;
  }
  return e instanceof Error ? e.message : "操作失敗";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function AnnouncementsTab({ facilityId }: { facilityId: string }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await adminClinicsApi.announcements.list(facilityId));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = items.filter((a) => a.is_active).length;
  const atLimit = activeCount >= MAX_ACTIVE;

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await adminClinicsApi.announcements.create(facilityId, {
        title: title.trim(),
        content: content.trim(),
      });
      setItems((cs) => [created, ...cs]);
      setTitle("");
      setContent("");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (a: Announcement) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await adminClinicsApi.announcements.update(
        facilityId,
        a.id,
        { is_active: !a.is_active },
      );
      setItems((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await adminClinicsApi.announcements.delete(facilityId, id);
      setItems((cs) => cs.filter((c) => c.id !== id));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Megaphone className="size-5" />
          </span>
          <div>
            <h3 className="font-semibold text-foreground">公告</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              民眾端最多顯示 3 則
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
            atLimit
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              : "bg-primary/10 text-primary",
          )}
        >
          {activeCount} / {MAX_ACTIVE}
        </span>
      </div>

      {error && (
        <p className="rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive ring-1 ring-destructive/15">
          {error}
        </p>
      )}

      {/* 新增 */}
      <div className="space-y-3 rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="標題"
          className="h-9 bg-background"
          disabled={atLimit}
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="公告內容…"
          rows={2}
          className="bg-background"
          disabled={atLimit}
        />
        <div className="flex items-center justify-between gap-3">
          {atLimit ? (
            <p className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              已有 3 則顯示中，請先將一則設為過期再新增。
            </p>
          ) : (
            <span />
          )}
          <Button
            type="button"
            size="sm"
            disabled={busy || atLimit || !title.trim() || !content.trim()}
            onClick={handleCreate}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {busy ? "處理中…" : "新增公告"}
          </Button>
        </div>
      </div>

      {/* 清單 */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Megaphone className="size-7 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">尚無公告。</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-2xl p-4 ring-1 ring-foreground/5 transition hover:bg-muted/30"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Megaphone className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {a.title && (
                    <span className="text-sm font-semibold text-foreground">
                      {a.title}
                    </span>
                  )}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      a.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {a.is_active ? "顯示中" : "已過期"}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                    <CalendarDays className="size-3.5" />
                    {formatDate(a.created_at)}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">
                  {a.content}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => handleToggle(a)}
                >
                  {a.is_active ? "設為過期" : "重新顯示"}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="刪除"
                  disabled={busy}
                  onClick={() => handleDelete(a.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
