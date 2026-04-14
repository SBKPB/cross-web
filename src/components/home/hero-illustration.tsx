import { cn } from "@/lib/utils";

interface HeroIllustrationProps {
  className?: string;
}

/**
 * Hero 右側裝飾插畫：柔和幾何 + 醫療十字
 * 純 SVG，無外部依賴，好維護
 */
export function HeroIllustration({ className }: HeroIllustrationProps) {
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("w-full h-full", className)}
    >
      {/* 背景大圓 */}
      <circle cx="260" cy="240" r="200" fill="currentColor" className="text-primary/10" />
      {/* 副圓 */}
      <circle cx="120" cy="120" r="60" fill="currentColor" className="text-primary/20" />
      <circle cx="400" cy="380" r="40" fill="currentColor" className="text-primary/15" />

      {/* 中央卡片（模擬診所卡片） */}
      <rect
        x="140"
        y="160"
        width="220"
        height="160"
        rx="20"
        fill="white"
        stroke="currentColor"
        strokeWidth="2"
        className="text-border"
      />

      {/* 十字符號 */}
      <g transform="translate(220 200)">
        <rect x="20" y="0" width="20" height="60" rx="4" fill="currentColor" className="text-primary" />
        <rect x="0" y="20" width="60" height="20" rx="4" fill="currentColor" className="text-primary" />
      </g>

      {/* 卡片下方假文字線 */}
      <rect x="160" y="275" width="140" height="8" rx="4" fill="currentColor" className="text-border" />
      <rect x="160" y="293" width="90" height="6" rx="3" fill="currentColor" className="text-border/60" />

      {/* 漂浮小點 */}
      <circle cx="80" cy="260" r="8" fill="currentColor" className="text-primary/40" />
      <circle cx="420" cy="140" r="6" fill="currentColor" className="text-primary/50" />
      <circle cx="360" cy="80" r="4" fill="currentColor" className="text-primary/30" />
    </svg>
  );
}
