import assert from "node:assert/strict";
import test from "node:test";
import { DYNAMIC_PAGE_CACHE, STATIC_PAGE_CACHE } from "../src/lib/cache-control.ts";

// 登入、會員、加入頁的 load：快取標頭對齊舊版（3100 基準實測）與頁面 metadata。
// 舊版這些頁都是 client component，但 Next 仍預先渲染（s-maxage=31536000）；只有 /member/appointments/[id]
// 讀動態路由參數而為動態渲染（private, no-cache, no-store…）。

async function runLoad(file, params = {}) {
  const { load } = await import(file);
  const headers = [];
  const data = await load({ params, setHeaders: (h) => headers.push(h) });
  return { data, headers };
}

for (const route of ["auth", "auth/complete-profile", "member", "member/favorites", "member/patients"]) {
  test(`/${route}：靜態頁快取，<head> 用全站預設（不回 seo）`, async () => {
    const { data, headers } = await runLoad(`../src/routes/${route}/+page.ts`);
    assert.deepEqual(headers, [{ "cache-control": STATIC_PAGE_CACHE }]);
    assert.equal(data?.seo, undefined);
  });
}

test("/member/appointments/[id]：動態頁快取標頭，回傳路由參數", async () => {
  const { data, headers } = await runLoad("../src/routes/member/appointments/[id]/+page.ts", { id: "abc" });
  assert.deepEqual(headers, [{ "cache-control": DYNAMIC_PAGE_CACHE }]);
  assert.deepEqual(data, { id: "abc" });
});

test("/join：metadata 同舊版（canonical /join），靜態頁快取", async () => {
  const { data, headers } = await runLoad("../src/routes/join/+page.ts");
  assert.deepEqual(headers, [{ "cache-control": STATIC_PAGE_CACHE }]);
  assert.deepEqual(data.seo, {
    title: "Design Partner 共同合作",
    description: "Cross 募集 3–5 家醫療院所、健康服務機構與設備夥伴，共同設計並量化驗證資料與預約工作流程。",
    canonical: "/join",
  });
});

test("/join/apply：metadata 同舊版（沒有自己的 canonical → 沿用全站 /），靜態頁快取", async () => {
  const { data, headers } = await runLoad("../src/routes/join/apply/+page.ts");
  assert.deepEqual(headers, [{ "cache-control": STATIC_PAGE_CACHE }]);
  assert.deepEqual(data.seo, {
    title: "申請加入 Cross",
    description: "填寫商家資料申請加入 Cross 預約平台。送出後我們會寄驗證信，設定密碼並通過審核即可開通院所後台。",
    canonical: "/",
  });
});

test("/join/verify：帶一次性 token 的頁面 noindex、nofollow，描述沿用全站，靜態頁快取", async () => {
  const { data, headers } = await runLoad("../src/routes/join/verify/+page.ts");
  assert.deepEqual(headers, [{ "cache-control": STATIC_PAGE_CACHE }]);
  assert.deepEqual(data.seo, { title: "驗證信箱並設定密碼", canonical: "/", noindex: true });
});
