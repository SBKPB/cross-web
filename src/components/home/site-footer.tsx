import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

const LINK_GROUPS: { title: string; links: FooterLink[] }[] = [
  {
    title: "民眾端",
    links: [
      { label: "找診所", href: "/search" },
      { label: "各縣市診所", href: "/area" },
      { label: "各科別診所", href: "/specialty" },
      { label: "我的預約", href: "/member" },
    ],
  },
  {
    title: "醫療院所",
    links: [
      { label: "診所登入", href: "/admin" },
      { label: "夥伴加入", href: "/join" },
      { label: "方案與定價", href: "/pricing" },
    ],
  },
  {
    title: "關於 Cross",
    links: [
      {
        label: "隱私權政策",
        href: "https://blog.twinhao.com/5nilhs02DalcM7",
        external: true,
      },
      { label: "服務條款", href: "/terms" },
    ],
  },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    "group inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary";

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {link.label}
        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-border bg-white dark:bg-card">
      {/* 頂部品牌色漸層細線，呼應 Cross 視覺語言 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr] lg:gap-16">
          {/* 品牌欄 */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/cross-icon.png"
                alt="Cross"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg"
              />
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Cross
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              整合全台醫療資源，讓預約看診變得更簡單。健保、自費、醫美，一站搞定。
            </p>
          </div>

          {/* 連結欄 */}
          <nav
            aria-label="頁尾導覽"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {LINK_GROUPS.map((group) => (
              <div key={group.title} className="space-y-3.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {group.title}
                </h4>
                <ul className="space-y-2.5 text-sm">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* 底部列 */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {year} Cross Healthcare by Twinhao. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            Made with
            <Heart className="h-3.5 w-3.5 fill-primary/80 text-primary" />
            in Taiwan
          </p>
        </div>
      </div>
    </footer>
  );
}
