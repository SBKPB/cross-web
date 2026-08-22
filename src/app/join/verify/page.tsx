import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { VerifyForm } from "@/components/join/verify-form";

export const metadata: Metadata = {
  title: "驗證信箱並設定密碼",
  // 這頁帶著一次性 token，不該被索引或出現在搜尋結果
  robots: { index: false, follow: false },
};

export default function JoinVerifyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <Suspense
          fallback={
            <div className="text-sm text-muted-foreground">載入中…</div>
          }
        >
          <VerifyForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
