"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Plus, Tag, Trash2, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  lumaIconBadge,
  lumaPageContainer,
  lumaSectionDesc,
  lumaSectionTitle,
} from "@/lib/styles/luma";
import { FACILITY_TYPE_LABELS } from "@/lib/constants/clinic-constants";
import {
  adminServiceCategoriesApi,
  type ServiceCategoryAdmin,
} from "@/lib/api/admin/service-categories";
import type { FacilityType } from "@/types/clinic";
import { useRequireSystemAdmin } from "@/lib/auth/use-require-system-admin";

// 大類顯示順序（固定 4 類；付款軸不在此管理）
const FACILITY_ORDER: FacilityType[] = [
  "healthcare",
  "aesthetic",
  "beauty",
  "other",
];

export default function AdminSettingsPage() {
  useRequireSystemAdmin();

  const [categories, setCategories] = useState<ServiceCategoryAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ id: string; label: string } | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await adminServiceCategoriesApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (facilityType: FacilityType) => {
    const label = (drafts[facilityType] ?? "").trim();
    if (!label) return;
    setBusyId(`add-${facilityType}`);
    setError(null);
    try {
      // 只送 label；code 由後端自動產生 UUID
      const created = await adminServiceCategoriesApi.create({
        facility_type: facilityType,
        label,
      });
      setCategories((cs) => [...cs, created]);
      setDrafts((d) => ({ ...d, [facilityType]: "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setBusyId(null);
    }
  };

  const handleRename = async () => {
    if (!editing) return;
    const label = editing.label.trim();
    if (!label) return;
    setBusyId(editing.id);
    setError(null);
    try {
      const updated = await adminServiceCategoriesApi.update(editing.id, {
        label,
      });
      setCategories((cs) =>
        cs.map((c) => (c.id === updated.id ? updated : c)),
      );
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失敗");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await adminServiceCategoriesApi.delete(id);
      setCategories((cs) => cs.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "刪除失敗");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={lumaPageContainer}>
      <div className="space-y-1">
        <h1 className={lumaSectionTitle}>系統設定</h1>
        <p className={lumaSectionDesc}>調整系統參數與偏好設定</p>
      </div>

      <Card>
        <CardHeader>
          <div className={lumaIconBadge}>
            <Tag className="size-5" />
          </div>
          <CardTitle>服務類別管理</CardTitle>
          <CardDescription>
            管理各服務型態底下的子類別（民眾端篩選與院所建檔的可選項目）。大類（看診
            / 醫美 / 美容 / 其他）與健保 / 自費付款方式為固定結構，不在此調整。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-7">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">載入中…</p>
          ) : (
            FACILITY_ORDER.map((ft) => {
              const items = categories
                .filter((c) => c.facility_type === ft)
                .sort((a, b) => a.sort_order - b.sort_order);
              return (
                <section key={ft} className="space-y-3">
                  <h3 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
                    {FACILITY_TYPE_LABELS[ft]}
                    <span className="text-xs font-normal text-muted-foreground">
                      {items.length} 個項目
                    </span>
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {items.map((c) =>
                      editing?.id === c.id ? (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-background py-0.5 pl-2 pr-1"
                        >
                          <Input
                            autoFocus
                            value={editing.label}
                            onChange={(e) =>
                              setEditing({ ...editing, label: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename();
                              if (e.key === "Escape") setEditing(null);
                            }}
                            className="h-7 w-36 border-0 px-1 text-sm shadow-none focus-visible:ring-0"
                          />
                          <button
                            type="button"
                            aria-label="儲存"
                            disabled={busyId === c.id}
                            onClick={handleRename}
                            className="rounded-full p-1 text-primary hover:bg-primary/10 disabled:opacity-50"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="取消"
                            onClick={() => setEditing(null)}
                            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                          >
                            <X className="size-3.5" />
                          </button>
                        </span>
                      ) : (
                        <span
                          key={c.id}
                          className="group inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1.5 text-sm"
                        >
                          <span className="text-foreground">{c.label}</span>
                          <button
                            type="button"
                            aria-label={`重新命名 ${c.label}`}
                            onClick={() =>
                              setEditing({ id: c.id, label: c.label })
                            }
                            className="rounded-full p-0.5 text-muted-foreground opacity-60 transition hover:bg-foreground/10 hover:text-foreground group-hover:opacity-100"
                          >
                            <Pencil className="size-3" />
                          </button>
                          <button
                            type="button"
                            aria-label={`刪除 ${c.label}`}
                            disabled={busyId === c.id}
                            onClick={() => handleDelete(c.id)}
                            className="rounded-full p-0.5 text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </span>
                      ),
                    )}
                    {items.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        尚無項目
                      </span>
                    )}
                  </div>

                  {/* 新增：只填顯示名稱，code 由後端自動產生 */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={drafts[ft] ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [ft]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd(ft);
                      }}
                      placeholder={`新增${FACILITY_TYPE_LABELS[ft]}項目，例如「雷射光療」`}
                      className="h-9 max-w-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === `add-${ft}` || !(drafts[ft] ?? "").trim()}
                      onClick={() => handleAdd(ft)}
                    >
                      <Plus className="size-4" />
                      {busyId === `add-${ft}` ? "新增中…" : "新增"}
                    </Button>
                  </div>
                </section>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
