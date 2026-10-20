import assert from "node:assert/strict";
import test from "node:test";
import { DYNAMIC_PAGE_CACHE } from "../src/lib/cache-control.ts";
import { load } from "../src/routes/search/+page.ts";

// /search 的 load（移植自舊版 app/search/page.tsx）：metadata 逐字取自 3100 基準實際輸出；
// 舊版讀 searchParams 而為動態渲染，回應標頭是 Next 動態頁固定的 private, no-cache, no-store…

function run(qs) {
  const headers = {};
  const data = load({
    url: new URL(`https://cross.twinhao.com/search${qs}`),
    setHeaders: (h) => Object.assign(headers, h),
  });
  return { data, headers };
}

test("/search：title、description 與舊版 metadata 相同，canonical 沿用 root layout 的首頁網址", () => {
  const { data } = run("");
  assert.deepEqual(data.seo, {
    title: "搜尋店家",
    description: "搜尋全台看診、醫美、美容與其他合作店家，線上預約",
    canonical: "/",
  });
});

test("/search：回應標頭與舊版動態頁相同（不進 CDN 快取）", () => {
  assert.equal(DYNAMIC_PAGE_CACHE, "private, no-cache, no-store, max-age=0, must-revalidate");
  const { headers } = run("?q=abc");
  assert.deepEqual(headers, { "cache-control": DYNAMIC_PAGE_CACHE });
});

test("/search：網址參數解析為初始篩選", () => {
  assert.deepEqual(run("?type=self_pay&city=%E9%AB%98%E9%9B%84%E5%B8%82&cat=a,b&q=%E5%85%92").data.initialFilters, {
    search: "兒",
    city: "高雄市",
    serviceCategories: ["a", "b"],
    hospitalLevel: "all",
    facilityType: "healthcare",
    paymentType: "self_pay",
  });
});
