import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { JoinForm } from "@/components/join/join-form";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";

export const metadata: Metadata = {
  title: "申請加入 Cross",
  description:
    "填寫商家資料申請加入 Cross 預約平台。送出後我們會寄驗證信，設定密碼並通過審核即可開通院所後台。",
};

/**
 * 申請流程的第一步（填寫資料）。
 *
 * 刻意獨立成一頁而不是塞在 /join 落地頁底部：18 個欄位鋪在行銷內容後面，
 * 使用者會邊看邊被打斷；而且「申請」是一段有前後關係的流程
 * （填寫 → 驗證信箱 → 審核），值得有自己的空間。
 */
export default function JoinApplyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-10 sm:py-14">
          <Link
            href="/join"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            回夥伴加入
          </Link>
          <div className="mt-6">
            <JoinForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
