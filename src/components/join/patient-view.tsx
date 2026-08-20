/**
 * /join：「民眾眼中的你」
 *
 * 刻意直接引用民眾端真正在用的 <ClinicCard />，而不是另外仿一張——雙邊產品最強的
 * 說服力就是「這就是實際畫面」，仿的一旦跟真的走鐘，這段話立刻失效。
 *
 * 卡片以 pointer-events-none + aria-hidden 呈現：這裡是展示而非可用的搜尋結果，
 * 真正的入口是下方 CTA。
 */
import { ClinicCard } from "@/components/clinics/clinic-card";
import type { Clinic } from "@/types/clinic";

/** 示範資料：填得完整的院所長什麼樣（欄位對齊民眾端搜尋結果） */
const SAMPLE_CLINIC: Clinic = {
  id: "sample",
  clinic_name: "康健家庭醫學診所",
  hospital_level: "clinic",
  departments: ["family_medicine", "internal_medicine", "pediatrics"],
  phone: "02-2345-6789",
  address: "台北市大安區信義路四段 100 號",
  facility_type: "healthcare",
  payment_type: "both",
  logo: null,
  // 不放 rating / review_count：後端目前一律回 null（評分尚未實作），
  // 在招商頁展示等於承諾一個還不存在的功能。
  is_featured: true,
  business_hours: [
    { day: "週一", open: "09:00", close: "21:00", is_closed: false },
    { day: "週二", open: "09:00", close: "21:00", is_closed: false },
    { day: "週三", open: "09:00", close: "21:00", is_closed: false },
    { day: "週四", open: "09:00", close: "21:00", is_closed: false },
    { day: "週五", open: "09:00", close: "21:00", is_closed: false },
    { day: "週六", open: "09:00", close: "12:00", is_closed: false },
    { day: "週日", open: "09:00", close: "12:00", is_closed: false },
  ],
};

/** 卡片上每個東西是後台哪裡來的——順便告訴院所「填得完整才好看」 */
const SOURCES: { label: string; from: string }[] = [
  { label: "精選置頂", from: "專業方案解鎖，排在搜尋結果最前面" },
  { label: "服務型態與付款方式", from: "看診／醫美／美容分流，健保或自費一眼看出" },
  { label: "科別與營業時間", from: "你在後台填的資料，改完民眾端立刻同步" },
];

export function PatientView() {
  return (
    <section className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              民眾眼中的你
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              右邊不是示意圖。那是民眾在 Cross
              搜尋時看到的同一張卡片、同一個元件——你上架後就長這樣。
            </p>
            <ul className="mt-6 space-y-3">
              {SOURCES.map((s) => (
                <li key={s.label} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {s.label}
                    </span>
                    ｜{s.from}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* 展示用途：不可點，真正入口是頁面下方的申請表 */}
          <div aria-hidden className="pointer-events-none select-none">
            <ClinicCard clinic={SAMPLE_CLINIC} />
          </div>
        </div>
      </div>
    </section>
  );
}
