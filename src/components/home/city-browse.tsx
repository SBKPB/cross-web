import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { citiesWithCounts, getAllClinics } from "@/lib/seo/landing-data";

// 首頁最多列幾個縣市，其餘導向 /area
const MAX_CITIES = 12;

/**
 * 首頁縣市入口。
 *
 * 取代原本的「想預約哪一種？」4 張分類卡 —— 那 4 個選項與 Hero 搜尋列的 tab
 * 是完全相同的 4 類、完全相同的目的地（/search?type=），使用者在 Hero 選過一次
 * 又被問一次。改成縣市可回答民眾的第一個問題「我家附近有沒有」，同時把既有的
 * /area 在地落地頁接進首頁內部連結（原本只有 footer 連得到）。
 *
 * 只列出真的有店家的縣市，數字直接取自資料，店家變多會自己長出來。
 */
export async function CityBrowse() {
  const clinics = await getAllClinics();
  const cities = citiesWithCounts(clinics);

  if (cities.length === 0) return null;

  return (
    // 下緣刻意比上緣窄：這區只有一到兩列，用對稱的 py-20 會和下一區的
    // py-20 疊成 160px 空白，短內容看起來像斷片。
    <section className="container mx-auto px-4 pt-16 pb-10 sm:pt-20 sm:pb-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold tracking-wide text-primary">
            找附近
          </p>
          <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            你在哪一區？
          </h2>
          <p className="text-sm text-muted-foreground">
            選縣市，看看附近有哪些店家可以線上預約
          </p>
        </div>
        <Link
          href="/area"
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
        >
          全部縣市
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* flex-wrap 而非 grid：店家還少時只會排出一列短的，看起來是刻意的；
          grid 會留下空格位，反而像資料缺漏。店家變多會自然填滿成密集區塊。 */}
      <ul className="flex flex-wrap gap-3">
        {cities.slice(0, MAX_CITIES).map(({ city, count }) => (
          <li key={city}>
            <Link
              href={`/area/${encodeURIComponent(city)}`}
              className="flex min-w-[150px] items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-border/60 transition hover:ring-primary/40"
            >
              <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                <MapPin className="size-4 shrink-0 text-primary" />
                <span className="truncate">{city}</span>
              </span>
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                {count} 間
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
