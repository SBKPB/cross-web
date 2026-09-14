import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

interface AuthSplitLayoutProps {
  variant: "consumer" | "console";
  children: React.ReactNode;
}

const COPY = {
  consumer: {
    headline: "預約看診，從此簡單",
    subtitle: "健保、自費、醫美，一站搞定。",
    bullets: [
      "一站搜尋全台合作店家",
      "24 小時線上預約掛號",
      "預約紀錄一目了然",
    ],
  },
  console: {
    headline: "院所管理 Console",
    subtitle: "線上接收預約，管理排程與人員。",
    bullets: [
      "24 小時線上接收預約",
      "排程班表與人員管理",
      "LINE 自動提醒，降低爽約",
    ],
  },
} as const;

/**
 * 登入頁共用 split-screen 版型
 * - 桌機（lg+）：左品牌側欄 + 右表單
 * - 手機：僅置中表單（品牌側欄隱藏）
 */
export function AuthSplitLayout({ variant, children }: AuthSplitLayoutProps) {
  if (variant === "consumer") {
    return (
      <div className="public-page grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#102647] p-12 text-white lg:flex">
          <Image src="/images/cross-care-hero.webp" alt="" fill priority sizes="52vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#102647] via-[#102647]/15 to-[#102647]/35" />
          <Link href="/" className="relative flex w-fit items-center gap-3 text-xl font-semibold"><Image src="/cross-icon.png" alt="" width={36} height={36} className="rounded-xl" />Cross</Link>
          <div className="relative max-w-md pb-3">
            <p className="text-xs font-medium tracking-[0.16em] text-blue-100">YOUR EVERYDAY CARE</p>
            <h2 className="mt-4 text-4xl font-semibold leading-snug tracking-tight">留點時間，<br />好好照顧自己。</h2>
            <p className="mt-5 text-base leading-8 text-blue-100">從找到服務到管理預約，<br />每一次安排，都更從容。</p>
          </div>
        </aside>
        <main className="relative flex min-h-screen flex-col items-center justify-center px-5 py-20 sm:px-10">
          <Link href="/" className="absolute top-7 left-6 inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-primary">← 返回 Cross 首頁</Link>
          {children}
          <p className="mt-7 text-xs text-muted-foreground">Cross · 你的健康日常</p>
        </main>
      </div>
    );
  }

  const copy = COPY[variant];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 左：品牌側欄 */}
      <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        {/* 光暈 */}
        <div className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-[360px] rounded-full bg-white/10 blur-3xl" />
        {/* 點陣紋理 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage:
              "radial-gradient(ellipse at 30% 20%, black, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 30% 20%, black, transparent 75%)",
          }}
        />

        {/* logo */}
        <Link
          href="/"
          className="relative inline-flex items-center gap-2.5"
          aria-label="返回首頁"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/95 p-1">
            <Image
              src="/cross-icon.png"
              alt="Cross"
              width={28}
              height={28}
              priority
              className="size-7 rounded-md"
            />
          </span>
          <span className="text-lg font-semibold tracking-tight">Cross</span>
        </Link>

        {/* 標語 + 賣點 */}
        <div className="relative max-w-sm">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            {copy.headline}
          </h2>
          <p className="mt-3 text-base text-primary-foreground/80">
            {copy.subtitle}
          </p>
          <ul className="mt-8 space-y-3.5">
            {copy.bullets.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-sm text-primary-foreground/90">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} Cross Healthcare by Twinhao
        </p>
      </aside>

      {/* 右：表單 */}
      <main className="flex items-center justify-center bg-background p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
