import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../src/routes/api/join/+server.ts";

const ORIGIN = "https://cross.twinhao.com";
const VALID = {
  category: "clinic",
  business_name: "安心診所",
  contact_name: "王小明",
  phone: "0912345678",
  email: "owner@example.com",
  city: "台北市",
  service_categories: ["internal_medicine"],
  payment_type: "both",
};

/**
 * 模擬 SvelteKit RequestEvent。event.fetch 代表內部 /api/v1 代理；
 * 全域 fetch 只用來寄 Resend，測試中一律攔下、不會真的寄信。
 */
function event(body, backend = { status: 201, json: { email_sent: true } }) {
  const calls = [];
  return {
    calls,
    url: new URL(`${ORIGIN}/api/join`),
    request: new Request(`${ORIGIN}/api/join`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url) === "/api/v1/service-categories") {
        return Response.json({
          facility_types: [{ value: "healthcare", label: "看診", categories: [{ code: "internal_medicine", label: "內科" }] }],
          payment_types: [],
        });
      }
      return Response.json(backend.json, { status: backend.status });
    },
  };
}

let resend;
test.beforeEach((t) => {
  resend = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    resend.push({ url: String(url), init });
    return new Response("{}", { status: 200 });
  });
  t.mock.method(console, "info", () => {});
  t.mock.method(console, "error", () => {});
  process.env.RESEND_API_KEY = "test-key";
  process.env.JOIN_NOTIFY_EMAIL = "ops@example.com, boss@example.com";
  delete process.env.JOIN_NOTIFY_FROM;
});

test("驗證：壞 JSON、缺欄位回 400；蜜罐回 200 且不打後端、不寄信", async () => {
  let res = await POST(event("{"));
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { ok: false, error: "格式錯誤" });

  res = await POST(event({ ...VALID, business_name: " " }));
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { ok: false, error: "請填寫商家名稱" });

  res = await POST(event({ ...VALID, email: "not-an-email" }));
  assert.deepEqual(await res.json(), { ok: false, error: "請填寫正確的 Email" });

  const spam = event({ ...VALID, hp: "bot" });
  res = await POST(spam);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(spam.calls.length, 0);
  assert.equal(resend.length, 0);
});

test("成功：經代理建立申請單，並以 Resend 通知營運（重寄不再通知）", async () => {
  const e = event(VALID);
  const res = await POST(e);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });

  const create = e.calls.find((c) => c.url === "/api/v1/facility-applications");
  assert.equal(create.init.method, "POST");
  assert.deepEqual(JSON.parse(create.init.body), {
    business_name: "安心診所",
    contact_name: "王小明",
    phone: "0912345678",
    email: "owner@example.com",
    city: "台北市",
    facility_type: "healthcare",
    payment_type: "both",
    service_categories: ["internal_medicine"],
  });

  assert.equal(resend.length, 1);
  assert.equal(resend[0].url, "https://api.resend.com/emails");
  assert.equal(resend[0].init.headers.Authorization, "Bearer test-key");
  const mail = JSON.parse(resend[0].init.body);
  assert.deepEqual(mail.to, ["ops@example.com", "boss@example.com"]);
  assert.equal(mail.from, "Cross <onboarding@cross.twinhao.com>");
  assert.ok(mail.html.includes(`${ORIGIN}/admin/applications`));
  assert.ok(mail.text.includes("內科"));

  const again = await POST(event({ ...VALID, resend: true }));
  assert.equal(again.status, 200);
  assert.equal(resend.length, 1);
});

test("後端錯誤如實回報：detail 原樣回 400；驗證碼沒寄出回 502", async () => {
  let res = await POST(event(VALID, { status: 409, json: { detail: "這個信箱已經有帳號" } }));
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { ok: false, error: "這個信箱已經有帳號" });

  res = await POST(event(VALID, { status: 201, json: { email_sent: false } }));
  assert.equal(res.status, 502);
  assert.match((await res.json()).error, /驗證碼寄送失敗/);
  assert.equal(resend.length, 0);
});
