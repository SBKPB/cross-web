import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/home/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-lg dark:bg-card/80">
      {/* 底部品牌色漸層細線，與 SiteFooter 頂部呼應 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
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

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-foreground hover:text-primary"
          >
            <Link href="/search">找診所</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-foreground hover:text-primary sm:inline-flex"
          >
            <Link href="/join">夥伴加入</Link>
          </Button>
          <ThemeToggle />
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
