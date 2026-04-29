import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/home/auth-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/cross-icon.png"
            alt="Cross"
            width={32}
            height={32}
            priority
            className="h-8 w-8 rounded-lg"
          />
          <span className="text-lg font-semibold text-foreground tracking-tight">
            Cross
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="text-foreground hover:text-primary">
            <Link href="/search">找診所</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex text-foreground hover:text-primary"
          >
            <Link href="/admin">診所登入</Link>
          </Button>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
