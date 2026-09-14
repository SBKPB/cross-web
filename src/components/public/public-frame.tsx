import type { ReactNode } from "react";
import { SiteHeader } from "@/components/home/site-header";
import { SiteFooter } from "@/components/home/site-footer";

export function PublicFrame({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className="public-page flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main id="public-content" className="min-w-0 flex-1">{children}</main>
      {footer && <SiteFooter />}
    </div>
  );
}
