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
        "fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3",
        "bg-background/80 backdrop-blur-lg",
        "border-t border-border/60",
        "lg:hidden",
        className,
      )}
    >
      <Button asChild size="lg" className="w-full shadow-lg">
        <Link href={`/booking/${clinicId}`}>
          <Calendar className="size-5" />
          立即預約
        </Link>
      </Button>
    </div>
  );
}
