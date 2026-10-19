import { ArrowRight, Database, Smartphone, Waves } from "lucide-react";
import waveform from "../../../public/developers/ecg-waveform.json";
import { Card, CardContent } from "@/components/ui/card";

const points = waveform.samples
  .map(
    (sample, index) =>
      `${((index * 500) / (waveform.samples.length - 1)).toFixed(2)},${(105 - sample / 12).toFixed(2)}`,
  )
  .join(" ");

export function PlatformFlow() {
  return (
    <Card className="relative gap-0 border border-border/60 bg-card/95 py-0 shadow-xl shadow-primary/5">
      <CardContent className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-xs tracking-wider text-muted-foreground">
            CROSS / DATA FLOW
          </span>
          <span className="rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-primary">
            沙盒資料示意
          </span>
        </div>
        <div className="mt-7 flex items-center justify-between gap-2">
          {[
            { icon: Waves, label: "合成訊號" },
            { icon: Smartphone, label: "原生 App" },
            { icon: Database, label: "Cross API" },
          ].map((item, index) => (
            <div key={item.label} className="contents">
              {index > 0 ? (
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : null}
              <div className="flex flex-1 flex-col items-center gap-3 rounded-2xl bg-muted/60 px-2 py-5">
                <item.icon className="size-5 text-primary" aria-hidden="true" />
                <span className="text-xs font-medium sm:text-sm">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
            <span className="text-sm font-medium">ECG · 導程 I</span>
            <span className="font-mono text-xs text-muted-foreground">
              250 Hz / 500 samples
            </span>
          </div>
          <svg
            viewBox="0 0 500 150"
            className="h-auto w-full text-primary"
            role="img"
            aria-label="2 秒的合成單導程 ECG 波形，僅供流程示意"
          >
            {Array.from({ length: 11 }, (_, index) => (
              <line
                key={`x${index}`}
                x1={index * 50}
                x2={index * 50}
                y1="0"
                y2="150"
                className="stroke-border"
                strokeWidth="0.6"
              />
            ))}
            {Array.from({ length: 6 }, (_, index) => (
              <line
                key={`y${index}`}
                x1="0"
                x2="500"
                y1={index * 30}
                y2={index * 30}
                className="stroke-border"
                strokeWidth="0.6"
              />
            ))}
            <polyline
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>單位 µV · 合成訊號</span>
            <span>2.0 秒</span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {["先保存", "原樣補傳", "讀回核對"].map((label, index) => (
            <span
              key={label}
              className="rounded-full border border-border px-3 py-1.5"
            >
              <span className="mr-2 font-mono text-primary">0{index + 1}</span>
              {label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
