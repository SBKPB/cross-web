"use client";

import { useState } from "react";
import { ChevronRight, Megaphone } from "lucide-react";

import { SectionCard } from "@/components/clinic-detail/section-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AnnouncementPublic } from "@/types/clinic";

interface AnnouncementsSectionProps {
  announcements: AnnouncementPublic[];
  className?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}/${m}/${day}`;
}

export function AnnouncementsSection({
  announcements,
  className,
}: AnnouncementsSectionProps) {
  const [selected, setSelected] = useState<AnnouncementPublic | null>(null);

  if (announcements.length === 0) return null;

  return (
    <>
      <SectionCard icon={Megaphone} title="公告" className={className}>
        <div className="divide-y divide-border">
          {announcements.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a)}
              className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {a.title ?? a.content}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(a.created_at)}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{selected?.title ?? "公告"}</DialogTitle>
            <DialogDescription>
              {selected ? formatDate(selected.created_at) : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {selected?.content}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
