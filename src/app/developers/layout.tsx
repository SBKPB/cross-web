import { SiteHeader } from "@/components/home/site-header";
import { SiteFooter } from "@/components/home/site-footer";

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#developer-content"
        className="sr-only z-[100] rounded-lg bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        跳到開發者內容
      </a>
      <SiteHeader />
      <main id="developer-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
