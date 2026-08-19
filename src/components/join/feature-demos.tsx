/**
 * /join 功能區的迷你 demo。
 *
 * 六張卡各放一個「假的 Cross 畫面」：時段 pill、休假格、推播卡、風險條、分類 chip
 * 都沿用後台與民眾端真正在用的視覺語彙，讓人一眼看到功能長什麼樣，而不是看圖示。
 * 純 HTML/CSS、無互動、無圖片，深色模式跟著 token 走。
 * 元素以 demo-step 循環動畫依序出現（keyframes 在 globals.css），讓畫面像正在
 * 發生的事而不是靜態圖；只在 motion-safe 下跑。
 */
import { cn } from "@/lib/utils";

/** 循環淡入（6s 一輪）；偏好減少動態時維持靜態 */
const step = "motion-safe:animate-[demo-step_6s_ease-in-out_infinite_both]";
/** 風險條由 0 長到 --demo-w */
const grow = "motion-safe:animate-[demo-grow_6s_ease-in-out_infinite_both]";
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

/** demo 外框：固定高度讓六張卡等高，內容置中 */
function Stage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-muted/40 p-4 ring-1 ring-foreground/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** 24 小時線上預約：深夜時間 + 選中的時段 + 已成立 */
export function BookingDemo() {
  return (
    <Stage>
      <div className="w-full max-w-[15rem]">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">週三 · 深夜</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            23:41
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          {["09:00", "09:30", "10:00"].map((t, i) => (
            <span
              key={t}
              style={delay(i * 140)}
              className={cn(
                "rounded-lg py-1.5 text-center text-xs font-medium tabular-nums ring-1",
                step,
                i === 1
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-card text-muted-foreground ring-foreground/10",
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <div
          style={delay(900)}
          className={cn(
            "mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400",
            step,
          )}
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          已為林小姐建立預約
        </div>
      </div>
    </Stage>
  );
}

/** 排程與班表：沒排休就是上班（休假制） */
export function ScheduleDemo() {
  const days = ["一", "二", "三", "四", "五", "六", "日"];
  const off = [2, 6]; // 週三、週日休診
  return (
    <Stage>
      <div className="w-full max-w-[15rem]">
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <div key={d} className="text-center">
              <div className="text-[10px] text-muted-foreground">{d}</div>
              {/* 看診日不標字（重複五次會稀釋焦點），只讓「休」說話 */}
              <div
                style={delay(i * 70)}
                className={cn(
                  "mt-1 grid h-8 place-items-center rounded-md text-[10px] font-medium",
                  step,
                  off.includes(i)
                    ? "bg-card text-muted-foreground ring-1 ring-dashed ring-foreground/20"
                    : "bg-primary/15",
                )}
              >
                {off.includes(i) ? (
                  "休"
                ) : (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
              </div>
            </div>
          ))}
        </div>
        <p
          style={delay(700)}
          className={cn("mt-3 text-center text-[11px] text-muted-foreground", step)}
        >
          只標休假，其餘自動視為看診
        </p>
      </div>
    </Stage>
  );
}

/** App 自動提醒：推播通知卡 */
export function ReminderDemo() {
  return (
    <Stage>
      <div
        style={delay(250)}
        className={cn(
          "w-full max-w-[15rem] rounded-xl bg-card p-3 shadow-sm ring-1 ring-foreground/10",
          step,
        )}
      >
        <div className="flex items-center gap-2">
          <span className="grid size-5 shrink-0 place-items-center rounded-md bg-primary text-[9px] font-bold text-primary-foreground">
            C
          </span>
          <span className="text-[11px] font-medium text-foreground">Cross</span>
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            18:00
          </span>
        </div>
        <p className="mt-2 text-xs font-semibold text-foreground">
          明天 10:30 家醫科回診
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          康健家庭醫學診所 · 王志明醫師
        </p>
      </div>
    </Stage>
  );
}

/** 人員與服務：一份可維護的清單 */
export function StaffDemo() {
  const rows = [
    { name: "王志明", meta: "家醫科", price: "NT$150" },
    { name: "林淑芬", meta: "皮膚科", price: "NT$400" },
    { name: "陳建宏", meta: "復健科", price: "NT$250" },
  ];
  return (
    <Stage>
      <div className="w-full max-w-[15rem] space-y-1.5">
        {rows.map((r, i) => (
          <div
            key={r.name}
            style={delay(i * 180)}
            className={cn(
              "flex items-center gap-2 rounded-lg bg-card px-2.5 py-1.5 ring-1 ring-foreground/10",
              step,
            )}
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
              {r.name.slice(0, 1)}
            </span>
            <span className="text-[11px] font-medium text-foreground">
              {r.name}
            </span>
            <span className="text-[10px] text-muted-foreground">{r.meta}</span>
            <span className="ml-auto text-[10px] font-medium tabular-nums text-foreground">
              {r.price}
            </span>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/** 爽約風險：把高風險的那筆挑出來 */
export function RiskDemo() {
  const rows = [
    { time: "09:00", name: "張先生", risk: 12, level: "低" },
    { time: "11:30", name: "李小姐", risk: 78, level: "高" },
  ];
  return (
    <Stage>
      <div className="w-full max-w-[15rem] space-y-2">
        {rows.map((r, i) => {
          const high = r.risk >= 50;
          return (
            <div
              key={r.time}
              style={delay(i * 220)}
              className={cn(
                "rounded-lg bg-card px-2.5 py-2 ring-1 ring-foreground/10",
                step,
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium tabular-nums text-foreground">
                  {r.time}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {r.name}
                </span>
                <span
                  className={cn(
                    "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    high
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {r.level} {r.risk}%
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    grow,
                    high ? "bg-amber-500" : "bg-foreground/20",
                  )}
                  style={
                    {
                      width: `${r.risk}%`,
                      "--demo-w": `${r.risk}%`,
                      animationDelay: `${i * 220}ms`,
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
}

/** 分眾曝光：民眾用分類找，你出現在對的那一類 */
export function ExposureDemo() {
  const tabs = ["看診", "醫美", "美容", "其他"];
  return (
    <Stage>
      <div className="w-full max-w-[15rem]">
        <div className="flex gap-1">
          {tabs.map((t, i) => (
            <span
              key={t}
              style={delay(i * 90)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                step,
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-foreground/10",
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <div
          style={delay(650)}
          className={cn(
            "mt-2.5 flex items-center gap-2 rounded-xl bg-card p-2.5 ring-1 ring-primary/30",
            step,
          )}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
            康
          </span>
          <div className="min-w-0">
            <div className="truncate text-[11px] font-semibold text-foreground">
              康健家庭醫學診所
            </div>
            <div className="mt-0.5 flex gap-1">
              <span className="rounded bg-muted px-1 py-px text-[9px] text-muted-foreground">
                健保
              </span>
              <span className="rounded bg-muted px-1 py-px text-[9px] text-muted-foreground">
                台北市
              </span>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}
