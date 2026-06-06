import { MapPinned, Phone, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WalkInCardProps {
  phone?: string | null;
  /** 後台勾選是否提供電話預約（預設關閉）；關閉時只顯示現場預約 */
  phoneBookingEnabled?: boolean;
  className?: string;
}

/** 未開通線上預約的院所：顯示現場預約；電話預約由後台勾選才顯示 */
export function WalkInCard({
  phone,
  phoneBookingEnabled = false,
  className,
}: WalkInCardProps) {
  const showPhone = phoneBookingEnabled && !!phone;

  return (
    <div
      className={cn(
        "rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Store className="size-5" />
        </span>
        <h3 className="text-lg font-bold text-foreground">現場預約</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {showPhone
          ? "本院所目前提供現場 / 電話預約，歡迎來電或臨櫃洽詢。"
          : "本院所目前提供現場預約，歡迎臨櫃洽詢。"}
      </p>

      {showPhone && (
        <Button asChild size="lg" className="mt-5 w-full font-semibold">
          <a href={`tel:${phone}`}>
            <Phone className="size-5" />
            撥打電話 {phone}
          </a>
        </Button>
      )}

      <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPinned className="size-3.5" />
          {showPhone ? "現場 / 電話即可預約" : "現場即可預約"}
        </span>
      </div>
    </div>
  );
}
