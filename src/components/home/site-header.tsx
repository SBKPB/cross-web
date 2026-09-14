import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/home/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <header className="glass-bar sticky top-0 z-50 border-b border-border/70">
      <div className="home-container flex h-16 items-center justify-between gap-3 sm:h-20">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Cross 首頁">
          <Image src="/cross-icon.png" alt="" width={32} height={32} priority className="size-8 rounded-lg" />
          <span className="text-lg font-semibold tracking-tight text-foreground">Cross</span>
        </Link>
        <nav aria-label="主要導覽" className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden rounded-full lg:inline-flex"><Link href={`${home ? "" : "/"}#how-it-works`}>如何預約</Link></Button>
          <Button asChild variant="ghost" size="sm" className="hidden rounded-full lg:inline-flex"><Link href={`${home ? "" : "/"}#get-app`}>下載 App</Link></Button>
          <Button asChild variant="ghost" size="sm" className="rounded-full text-foreground hover:text-primary"><Link href="/search">探索服務</Link></Button>
          <Button asChild variant="ghost" size="sm" className="hidden rounded-full text-foreground hover:text-primary sm:inline-flex"><Link href="/join">夥伴加入</Link></Button>
          <div className="max-[360px]:hidden"><ThemeToggle /></div>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
