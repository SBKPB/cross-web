// 搜尋頁結果比對：/search 的網址參數矩陣（關鍵字、服務大類、付款方式、縣市、醫療分級、子類別、無關參數、組合與無效值），
// 兩邊各開一次真的瀏覽器、等店家清單在瀏覽器端載入完，比較：
//   結果數（role=status 文字）、全部結果卡片的店名與順序（無結果時的空狀態標題）、
//   工具列狀態（關鍵字輸入框、按下的服務類型、縣市與醫療分級的顯示文字、按下的付款方式與服務分類、
//   已套用篩選 chips、「更多篩選（n）」）、頁面 JS 錯誤。
// seo-diff 只看伺服器 HTML，而店家清單是瀏覽器端抓的（伺服器 HTML 只有「載入店家中…」與骨架），所以結果數必須在瀏覽器裡比。
//
// 用法：node scripts/parity/search-diff.mjs --preview <url> [--base <url>] [--fixture] [--only <子字串>]
// - --fixture：兩邊的 GET /api/v1/booking/clinics 一律由瀏覽器攔截、回同一份假資料（FIXTURE，12 間涵蓋各大類／付款／分級／縣市／子類別），
//   不打後端；沒給則用各自後端的真實資料。服務分類字彙（/api/v1/service-categories）一律用真實後端。
// - 唯讀：只發 GET，不寫任何資料。基準預設本機舊版 Next（http://localhost:3100，接正式後端）；
//   也可 local-vs-local：--base http://localhost:3101 --preview http://localhost:4173（皆接 8001 dev DB）。
// - 預覽受 Vercel Deployment Protection 保護時設 VERCEL_AUTOMATION_BYPASS_SECRET；密鑰只加在送往預覽來源的請求（見 bypass.mjs）。
// - 標了 known 的案例是已知且刻意的差異（舊版 Next 把重複參數變成陣列而出錯），有差異時列為「已知」，不算失敗。
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";
import { BYPASS_PERMISSIONS, routeBypass } from "./bypass.mjs";

const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { values: args } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:3100" },
    preview: { type: "string" },
    fixture: { type: "boolean", default: false },
    only: { type: "string" },
  },
});
if (!args.preview) {
  console.error("用法：node scripts/parity/search-diff.mjs --preview <url> [--base <url>] [--fixture] [--only <子字串>]");
  process.exit(2);
}
const base = new URL(args.base).origin;
const preview = new URL(args.preview).origin;
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const redact = (text) => (BYPASS ? text.replaceAll(BYPASS, "***") : text);
const TIMEOUT_MS = Number(process.env.PARITY_FETCH_TIMEOUT_MS ?? 30_000);

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const staff = (n, name, role, main_specialties) => ({ id: `s${n}`, name, role, main_specialties });
/** 後端 ClinicListItem 形狀的假資料；店名唯一，結果以店名辨識（對照 id 見下方輸出） */
const FIXTURE = [
  { id: id(1), name: "仁愛家醫診所", hospital_level: "clinic", facility_type: "healthcare", payment_type: "nhi", address: "台北市大安區仁愛路四段1號", departments: ["family_medicine", "pediatrics"], members: [staff(1, "王大明", "doctor", ["過敏", "氣喘"])], rating: 4.5, phone: "02-2700-0001" },
  { id: id(2), name: "中港醫學中心", hospital_level: "medical_center", facility_type: "healthcare", payment_type: "both", address: "臺中市西屯區台灣大道三段99號", departments: ["internal_medicine", "surgery", "cardiology", "neurology"], rating: 4.0, is_featured: true, phone: "04-2300-0002" },
  { id: id(3), name: "港都區域醫院", hospital_level: "regional_hospital", facility_type: "healthcare", payment_type: "self_pay", address: "高雄市三民區博愛一路100號", departments: ["orthopedics", "rehabilitation"], rating: 3.8, phone: "07-3100-0003" },
  { id: id(4), name: "安心地區醫院", hospital_level: "district_hospital", facility_type: "healthcare", address: "新北市板橋區文化路一段5號", departments: ["ent", "ophthalmology"], rating: null, phone: null },
  { id: id(5), name: "晶亮醫美診所", hospital_level: "clinic", facility_type: "aesthetic", payment_type: "self_pay", address: "台北市信義區松仁路7號", departments: ["aes_injection", "aes_laser"], members: [staff(5, "李美玲", "doctor", ["雷射"])], rating: 4.8, is_featured: true, phone: "02-2700-0005" },
  { id: id(6), name: "柔光美學診所", hospital_level: "clinic", facility_type: "aesthetic", payment_type: "both", address: "高雄市前鎮區中華五路8號", departments: ["aes_lifting", "aes_skin"], rating: 4.2, phone: "07-3100-0006" },
  { id: id(7), name: "花漾美容工作室", hospital_level: "clinic", facility_type: "beauty", payment_type: "self_pay", address: "臺南市東區長榮路二段3號", departments: ["bty_facial", "bty_nail_lash"], members: [staff(7, "陳小花", "beautician")], rating: 4.9, phone: "06-2000-0007" },
  { id: id(8), name: "沐光 SPA 會館", hospital_level: "clinic", facility_type: "beauty", payment_type: "self_pay", address: "台北市中山區南京東路二段6號", departments: ["bty_spa", "bty_hair_removal"], phone: "02-2700-0008" },
  { id: id(9), name: "古法整復推拿", hospital_level: "clinic", facility_type: "other", payment_type: "self_pay", address: "桃園市中壢區中正路10號", departments: ["oth_manipulation"], members: [staff(9, "洪師傅", "therapist", ["整復"])], phone: "03-4200-0009" },
  { id: id(10), name: "樂活健康站", hospital_level: "clinic", facility_type: "other", payment_type: "nhi", address: null, departments: ["oth_misc"], phone: null },
  { id: id(11), name: "無類型牙醫診所", payment_type: "both", address: "台中市北區三民路三段12號", departments: ["dentistry"], members: [staff(11, "張牙醫", "doctor")], phone: "04-2200-0011" },
  { id: id(12), name: "全家中醫診所", hospital_level: "clinic", facility_type: "healthcare", payment_type: "both", address: "臺北市士林區中正路13號", departments: ["chinese_medicine", "family_medicine"], rating: 4.5, phone: "02-2800-0012" },
];

const DUP = "已知差異：舊版 Next 把重複參數變成陣列";
/** [查詢字串, known?] */
const CASES = [
  [""],
  // 關鍵字
  ["q=%E4%BB%81%E6%84%9B"], // 仁愛
  ["q=%E5%8F%B0%E5%8C%97"], // 台北（台／臺正規化）
  ["q=%E7%8E%8B%E5%A4%A7%E6%98%8E"], // 王大明（人員）
  ["q=%E9%81%8E%E6%95%8F"], // 過敏（人員專長）
  ["q=%E5%85%92%E7%A7%91"], // 兒科（子類別中文）
  ["q=%E5%96%AC"], // 喬（正式資料的店名）
  ["q=%E8%A8%BA%E6%89%80+%E9%AB%98%E9%9B%84"], // 診所 高雄（+ 為空白、多詞 AND）
  ["q=SPA"],
  ["q=%ZZ"], // 無效的 % 跳脫
  ["q=%E4%B8%8D%E5%AD%98%E5%9C%A8"], // 不存在
  ["q="],
  // 服務大類
  ["type=healthcare"],
  ["type=aesthetic"],
  ["type=beauty"],
  ["type=other"],
  ["type=self_pay"],
  ["type=foo"],
  ["type="],
  // 付款方式
  ["payment=nhi"],
  ["type=healthcare&payment=nhi"],
  ["type=healthcare&payment=self_pay"],
  ["type=self_pay&payment=nhi"],
  ["type=healthcare&payment="],
  ["type=healthcare&payment=xyz"],
  ["type=aesthetic&payment=nhi"],
  // 醫療分級
  ["level=clinic"],
  ["level=medical_center"],
  ["type=healthcare&level=regional_hospital"],
  ["type=beauty&level=clinic"],
  ["level="],
  ["level=bogus"],
  // 縣市
  ["city=%E8%87%BA%E5%8C%97%E5%B8%82"], // 臺北市
  ["city=%E5%8F%B0%E5%8C%97%E5%B8%82"], // 台北市（選單沒有這個值）
  ["city=%E9%AB%98%E9%9B%84%E5%B8%82"], // 高雄市
  ["city="],
  ["city=%E4%B8%8D%E5%AD%98%E5%9C%A8%E5%B8%82"], // 不存在市
  // 子類別
  ["cat=pediatrics"],
  ["cat=pediatrics,orthopedics"],
  ["cat=a,%20pediatrics,,oth_manipulation%20"],
  ["dept=surgery"],
  ["cat=&dept=surgery"],
  ["cat=,&dept=surgery"],
  ["cat=oth_manipulation&dept=surgery"],
  ["type=aesthetic&cat=aes_laser"],
  ["type=beauty&cat=family_medicine"],
  // 無關參數
  ["page=2"],
  ["Q=abc&sort=rating"],
  ["q=%E5%85%92%E7%A7%91;city=x"],
  // 組合
  ["q=%E8%A8%BA%E6%89%80&type=healthcare&city=%E8%87%BA%E5%8C%97%E5%B8%82"],
  ["type=self_pay&city=%E9%AB%98%E9%9B%84%E5%B8%82&level=regional_hospital"],
  ["type=healthcare&payment=nhi&cat=family_medicine&level=clinic&q=%E4%BB%81%E6%84%9B"],
  ["type=other&city=%E9%AB%98%E9%9B%84%E5%B8%82&cat=oth_manipulation"],
  ["type=aesthetic&payment=self_pay&level=medical_center&city=%E8%87%BA%E5%8C%97%E5%B8%82"],
  // 重複參數（舊版變陣列：q 載入後出錯、cat 伺服器 500、city 篩不到）
  ["q=a&q=b", DUP],
  ["cat=pediatrics&cat=surgery", DUP],
  ["city=%E8%87%BA%E5%8C%97%E5%B8%82&city=%E9%AB%98%E9%9B%84%E5%B8%82", DUP],
];

const browser = await chromium.launch({ executablePath: CHROME });

/** 開一頁、等店家清單載入完，抽出結果與工具列狀態 */
async function snapshot(origin, qs) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: "light",
    permissions: BYPASS_PERMISSIONS,
  });
  if (BYPASS) {
    await routeBypass(context, preview, BYPASS, { onError: (url) => console.log(`預覽請求失敗：${url}`) });
  }
  // 後註冊的 route 先處理：假資料蓋過 bypass 轉送
  if (args.fixture) {
    await context.route(
      (url) => url.pathname === "/api/v1/booking/clinics",
      (route) =>
        route.request().method() === "GET" ? route.fulfill({ json: FIXTURE }) : route.abort(),
    );
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.split("\n")[0]));
  try {
    const res = await page.goto(`${origin}/search${qs ? `?${qs}` : ""}`, { waitUntil: "load", timeout: TIMEOUT_MS });
    const http = res?.status();
    const settled = await page
      .waitForFunction(
        () => {
          const s = document.querySelector("main [role=status]");
          return s && !s.textContent.includes("載入店家中");
        },
        null,
        { timeout: 20_000 },
      )
      .then(() => true)
      .catch(() => false);
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    const ui = await page.evaluate(() => {
      const text = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : null);
      const all = (sel) => [...document.querySelectorAll(sel)].map(text);
      const main = document.querySelector("main");
      if (!main) return { main: false, body: text(document.body)?.slice(0, 120) };
      return {
        result: text(main.querySelector("[role=status]")),
        cards: [...main.querySelectorAll("[data-slot=card-title]")].map(text),
        empty: text(main.querySelector(".ring-border\\/60 h3")),
        alert: text(main.querySelector("[role=alert]")),
        keyword: main.querySelector('input[aria-label="搜尋店家、醫師、服務分類或地址"]')?.value ?? null,
        tab: all('main [aria-label="服務類型"] [aria-pressed=true]'),
        city: text(main.querySelector('[aria-label="縣市"]')),
        level: text(main.querySelector('details [aria-label="醫療分級"]')),
        payment: all('main details [aria-label="付款方式"] [aria-pressed=true]'),
        categories: all('main details [aria-label="服務分類"] [aria-pressed=true]'),
        chips: all('main [aria-label="已套用的篩選"] button[aria-label^="移除"]'),
        more: text(main.querySelector("details summary")),
      };
    });
    return { http, settled, ...ui, errors };
  } finally {
    await context.close();
  }
}

// 逐欄比對（HTTP 狀態在最前）
const FIELDS = ["http", "settled", "main", "body", "result", "cards", "empty", "alert", "keyword", "tab", "city", "level", "payment", "categories", "chips", "more", "errors"];
const show = (v) => (typeof v === "string" ? v : JSON.stringify(v));
const nameToId = new Map(FIXTURE.map((c) => [c.name, c.id]));

/** 一行摘要：結果數與前三筆（假資料附 id 末兩碼） */
function headline(s) {
  if (s.main === false) return `HTTP ${s.http}，沒有 main：${s.body ?? ""}`;
  const count = s.result?.match(/共 ?(\d+) ?間店家/)?.[1];
  const firsts = s.cards.slice(0, 3).map((n) => (args.fixture ? `${n}(${nameToId.get(n)?.slice(-2)})` : n));
  return `${count === undefined ? (s.result ?? "（無狀態）") : `${count} 間`}${firsts.length ? `，前幾筆 ${firsts.join("、")}` : ""}`;
}

console.log(`基準 ${base} ↔ 預覽 ${preview}（${args.fixture ? "假資料 FIXTURE" : "各自後端的真實資料"}）`);
let failed = 0;
let known = 0;
let total = 0;
for (const [qs, knownReason] of CASES) {
  if (args.only && !qs.includes(args.only)) continue;
  total++;
  const label = `/search${qs ? `?${qs}` : ""}`;
  const problems = [];
  let b;
  try {
    let p;
    [b, p] = await Promise.all([snapshot(base, qs), snapshot(preview, qs)]);
    for (const k of FIELDS) {
      if (JSON.stringify(b[k]) !== JSON.stringify(p[k])) problems.push(`${k}：${show(b[k])} → ${show(p[k])}`);
    }
    if (!b.settled && !p.settled && !knownReason) problems.push("兩邊都沒有載入完成");
  } catch (e) {
    problems.push(`失敗：${redact(e.message.split("\n")[0])}`);
  }
  if (problems.length && knownReason) {
    known++;
    console.log(`≈ ${label}  （${knownReason}）`);
  } else if (problems.length) {
    failed++;
    console.log(`✗ ${label}`);
  } else {
    console.log(`✓ ${label}  ${headline(b)}`);
  }
  for (const line of problems) console.log(`    ${line}`);
}
await browser.close();
console.log(
  `\n${total} 個案例：${total - failed - known} 個一致、${failed} 個不同${known ? `、${known} 個已知差異` : ""}`,
);
process.exitCode = failed ? 1 : 0;
