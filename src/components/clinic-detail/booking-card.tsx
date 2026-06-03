import Link from "next/link";
import { CalendarCheck, Clock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookingCardProps {
  clinicId: string;
  className?: string;
}

/** 桌機側欄的預約 CTA 卡片（手機改用底部 sticky bar） */
export function BookingCard({ clinicId, className }: BookingCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-700 p-6 text-primary-foreground shadow-lg shadow-primary/25",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-white/10 blur-2xl" />
      <h3 className="relative text-lg font-bold">線上預約</h3>
      <p className="relative mt-1 text-sm leading-relaxed text-primary-foreground/85">
        選擇門診時段，免電話排隊。
      </p>

      <Button
        asChild
        size="lg"
        variant="secondary"
        className="relative mt-5 w-full font-semibold"
      >
        <Link href={`/booking/${clinicId}`}>
          <CalendarCheck className="size-5" />
          立即預約
        </Link>
      </Button>

      <div className="relative mt-4 flex flex-col gap-2 text-xs text-primary-foreground/85">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          24 小時皆可線上預約
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" />
          預約成功即時通知
        </span>
      </div>
    </div>
  );
}
