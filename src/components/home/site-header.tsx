import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/home/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <header className="glass-bar sticky top-0 z-50 border-b border-border/70">
      <div className="home-container flex min-h-16 flex-wrap items-center justify-between gap-2 py-3 sm:h-20 sm:flex-nowrap sm:py-0">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Cross 首頁"
        >
          <Image
            src="/cross-icon.png"
            alt=""
            width={32}
            height={32}
            priority
            className="size-8 rounded-lg"
          />
          <span className="text-lg font-semibold tracking-tight">Cross</span>
        </Link>
        <nav aria-label="主要導覽" className="flex items-center gap-1 sm:gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden lg:inline-flex"
          >
            <Link href={`${home ? "" : "/"}#platform`}>平台</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/developers">開發者</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/join">共同合作</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/search">預約服務</Link>
          </Button>
          <span className="hidden min-[400px]:inline-flex">
            <ThemeToggle />
          </span>
          <span className="hidden md:inline-flex">
            <AuthButton />
          </span>
        </nav>
      </div>
    </header>
  );
}
