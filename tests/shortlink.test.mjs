import assert from "node:assert/strict";
import test from "node:test";
import { isHttpError, isRedirect } from "@sveltejs/kit";
import { DYNAMIC_PAGE_CACHE } from "../src/lib/cache-control.ts";

// /c/[code]：診所短網址（UUID 前 8 碼，不分大小寫）→ 308 永久轉址到 /clinic/{id}；找不到或後端失敗 → 404。
// 舊版為動態渲染：轉址與 404 都回 Next 動態頁標頭（3100 基準實測）。

const backendClinic = (id, name = "店家") => ({
  id,
  name,
  hospital_level: "clinic",
  address: "高雄市前金區中正四路 1 號",
  phone: "07-1234567",
  members: [],
  business_hours: [],
});

const CLINICS = [
  backendClinic("c406782c-628f-411c-890c-62a3dc4a5cf0", "康健"),
  backendClinic("ab000000-0000-0000-0000-000000000001", "第一間 ab"),
  backendClinic("ab000000-0000-0000-0000-000000000002", "第二間 ab"),
  // 示範院所：getClinics 會濾掉
  backendClinic("42399a23-1119-407e-91ed-e2df5bdbb218", "示範"),
];

async function run(code, { status = 200, clinics = CLINICS } = {}) {
  const { load } = await import("../src/routes/c/[code]/+page.server.ts");
  const headers = [];
  const calls = [];
  const fetch = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify(status === 200 ? clinics : { detail: "boom" }), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    await load({ params: { code }, fetch, setHeaders: (h) => headers.push(h) });
  } catch (thrown) {
    return { thrown, headers, calls };
  }
  return { thrown: null, headers, calls };
}

test.beforeEach((t) => {
  t.mock.method(globalThis, "fetch", () => assert.fail("後端只能經 event.fetch 走代理"));
});

test("前 8 碼（不分大小寫）→ 308 /clinic/{完整 id}，回動態頁快取標頭，經代理抓院所清單", async () => {
  for (const code of ["c406782c", "C406782C", "c4"]) {
    const { thrown, headers, calls } = await run(code);
    assert.ok(isRedirect(thrown), `${code}：應丟出 redirect`);
    assert.equal(thrown.status, 308);
    assert.equal(thrown.location, "/clinic/c406782c-628f-411c-890c-62a3dc4a5cf0");
    assert.deepEqual(headers, [{ "cache-control": DYNAMIC_PAGE_CACHE }]);
    assert.deepEqual(calls, ["/api/v1/booking/clinics"]);
  }
});

test("多筆符合時取清單中第一筆（與舊版 find 相同）", async () => {
  const { thrown } = await run("ab");
  assert.equal(thrown.location, "/clinic/ab000000-0000-0000-0000-000000000001");
});

test("找不到、示範院所、後端失敗 → 404（仍回動態頁快取標頭）", async () => {
  for (const [code, opts] of [
    ["zzzzzzzz", {}],
    ["42399a23", {}],
    ["c406782c", { status: 500 }],
  ]) {
    const { thrown, headers } = await run(code, opts);
    assert.ok(isHttpError(thrown), `${code}：應丟出 404`);
    assert.equal(thrown.status, 404);
    assert.deepEqual(headers, [{ "cache-control": DYNAMIC_PAGE_CACHE }]);
  }
});
