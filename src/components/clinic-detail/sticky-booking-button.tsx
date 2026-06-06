"use client";

import Link from "next/link";
import { Calendar, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StickyBookingButtonProps {
  clinicId: string;
  /** 是否開通線上預約（付費功能）；false 時改顯示撥打電話 */
  onlineBookingEnabled?: boolean;
  phone?: string | null;
  className?: string;
}

export function StickyBookingButton({
  clinicId,
  onlineBookingEnabled = true,
  phone,
  className,
}: StickyBookingButtonProps) {
  // 未開通線上預約且無電話 → 不顯示底部 bar
  if (!onlineBookingEnabled && !phone) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3",
        "bg-background/80 backdrop-blur-lg",
        "border-t border-border/60",
        "lg:hidden",
        className,
      )}
    >
      {onlineBookingEnabled ? (
        <Button asChild size="lg" className="w-full shadow-lg">
          <Link href={`/booking/${clinicId}`}>
            <Calendar className="size-5" />
            立即預約
          </Link>
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full shadow-lg">
          <a href={`tel:${phone}`}>
            <Phone className="size-5" />
            撥打電話預約
          </a>
        </Button>
      )}
    </div>
  );
}
