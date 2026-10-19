import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { PlatformHome } from "@/components/platform/platform-home";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-lg bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        跳到主要內容
      </a>
      <SiteHeader home />
      <main id="main-content" className="flex-1">
        <PlatformHome />
      </main>
      <SiteFooter />
    </div>
  );
}
