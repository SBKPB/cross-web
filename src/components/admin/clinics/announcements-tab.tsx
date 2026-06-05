"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
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
    <Card className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Megaphone className="size-4" />
            公告
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            民眾端最多顯示 3 則；目前顯示中{" "}
            <span className={atLimit ? "font-semibold text-amber-600" : ""}>
              {activeCount} / {MAX_ACTIVE}
            </span>
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* 新增 */}
      <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="標題"
          className="h-9"
          disabled={atLimit}
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="公告內容…"
          rows={2}
          disabled={atLimit}
        />
        <div className="flex items-center justify-between">
          {atLimit ? (
            <p className="text-sm text-amber-600">
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
            {busy ? "處理中…" : "新增公告"}
          </Button>
        </div>
      </div>

      {/* 清單 */}
      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無公告。</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-xl border border-border p-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {a.title && (
                    <span className="text-sm font-semibold text-foreground">
                      {a.title}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      a.is_active
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-border bg-muted text-muted-foreground"
                    }
                  >
                    {a.is_active ? "顯示中" : "已過期"}
                  </Badge>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
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
    </Card>
  );
}
