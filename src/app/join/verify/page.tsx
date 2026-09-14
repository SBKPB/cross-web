import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { VerifyForm } from "@/components/join/verify-form";
import { PageIntro } from "@/components/public/page-intro";

export const metadata: Metadata = {
  title: "驗證信箱並設定密碼",
  // 這頁帶著一次性 token，不該被索引或出現在搜尋結果
  robots: { index: false, follow: false },
};

export default function JoinVerifyPage() {
  return (
    <div className="public-page flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <PageIntro compact eyebrow="CROSS PARTNERS / 信箱驗證" title="完成信箱驗證" description="驗證信箱後，設定你的後台登入密碼。" />
        <div className="flex items-center justify-center px-4 py-12 sm:py-16">
        <Suspense
          fallback={
            <div className="text-sm text-muted-foreground">載入中…</div>
          }
        >
          <VerifyForm />
        </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
