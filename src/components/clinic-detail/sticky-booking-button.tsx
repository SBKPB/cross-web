"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StickyBookingButtonProps {
  clinicId: string;
  className?: string;
}

export function StickyBookingButton({
  clinicId,
  className,
}: StickyBookingButtonProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-n-border bg-n-card/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-lg sm:px-6",
        className
      )}
    >
      <Button
        asChild
        className="h-12 w-full rounded-xl bg-n-brand text-base font-semibold text-white shadow-lg transition-colors hover:bg-n-brand-hover"
      >
        <Link href={`/booking/${clinicId}`}>
          <Calendar className="mr-2 size-5" />
          馬上預約
        </Link>
      </Button>
    </div>
  );
}
