import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
  compact?: boolean;
}

export function PageIntro({ eyebrow, title, description, children, compact = false }: PageIntroProps) {
  return (
    <section className="border-b border-border/60 bg-[#eff4fa] dark:bg-[#142238]">
      <div className={`home-container ${compact ? "py-6 sm:py-8" : "py-10 sm:py-16"}`}>
        <nav aria-label="麵包屑" className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary">首頁</Link>
          <ChevronRight className="size-3" />
          <span aria-current="page">{title}</span>
        </nav>
        <p className="home-eyebrow">{eyebrow}</p>
        <h1 className={`mt-3 font-semibold leading-snug tracking-tight ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-5xl"}`}>{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>}
        {children}
      </div>
    </section>
  );
}
