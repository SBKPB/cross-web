"use client";

import { useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuccessCard } from "@/components/booking/success-card";
import { CalendarButtons } from "@/components/booking/calendar-buttons";
import { LineGuideSection } from "@/components/line/line-guide-section";
import { bookingApi } from "@/lib/api/booking";
import type { BookingResponse } from "@/types/booking";

interface SuccessPageProps {
  params: Promise<{
    "clinic-id": string;
  }>;
}

export default function SuccessPage({ params }: SuccessPageProps) {
  const { "clinic-id": clinicId } = use(params);
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(!!bookingId);
  const [error, setError] = useState(!bookingId);

  const primaryColor = "#ec4899";

  useEffect(() => {
    if (!bookingId) return;

    bookingApi
      .getBooking(bookingId)
      .then(setBooking)
      .catch((err) => {
        console.error("Failed to load booking:", err);
        setError(true);
      })
      .finally(() => setIsLoading(false));
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-3">
        <Link
          href={`/clinic/${clinicId}`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          返回診所
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-current"
            style={{ borderTopColor: primaryColor }}
          />
        </div>
      ) : error || !booking ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-sm text-slate-500">無法載入預約資訊</p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/clinic/${clinicId}`}>返回診所首頁</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Success Card */}
          <div className="py-4">
            <SuccessCard booking={booking} primaryColor={primaryColor} />
          </div>

          {/* Calendar Buttons */}
          <div className="py-4">
            <CalendarButtons booking={booking} primaryColor={primaryColor} />
          </div>

          {/* LINE 好友引導 */}
          <LineGuideSection />
        </>
      )}

      {/* Actions */}
      <div className="fixed inset-x-0 bottom-0 space-y-2 border-t bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button
          asChild
          variant="outline"
          className="h-12 w-full text-base"
        >
          <Link href={`/clinic/${clinicId}`}>返回診所首頁</Link>
        </Button>
      </div>
    </div>
  );
}
