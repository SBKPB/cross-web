import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/home/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <header className="glass-bar sticky top-0 z-50 border-b border-border">
      {/* 底部品牌色漸層細線，與 SiteFooter 頂部呼應 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className={`${home ? "home-container sm:h-20" : "container mx-auto px-4"} flex h-16 items-center justify-between`}>
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/cross-icon.png"
            alt="Cross"
            width={32}
            height={32}
            priority
            className="h-8 w-8 rounded-lg"
          />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Cross
          </span>
        </Link>

        <nav aria-label="主要導覽" className="flex items-center gap-1 sm:gap-2">
          {home && <><Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex"><a href="#how-it-works">如何預約</a></Button><Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex"><a href="#get-app">下載 App</a></Button></>}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-foreground hover:text-primary"
          >
            <Link href="/search">{home ? "探索服務" : "找診所"}</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-foreground hover:text-primary sm:inline-flex"
          >
            <Link href="/join">夥伴加入</Link>
          </Button>
          <div className={home ? "max-[360px]:hidden" : undefined}><ThemeToggle /></div>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
