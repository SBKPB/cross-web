import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { POST } from "../src/routes/api/track-view/+server.ts";

const IP = "203.0.113.77";
const CLINIC = "4f6c2a0e-1111-4222-8333-944455556666";

/** 模擬 SvelteKit RequestEvent：fetch 是 event.fetch（相對路徑走內部 /api/v1 代理） */
function event(body, headers = { "x-forwarded-for": `${IP}, 10.0.0.1` }) {
  const calls = [];
  return {
    calls,
    request: new Request("https://cross.twinhao.com/api/track-view", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body,
    }),
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(null, { status: 204 });
    },
  };
}

test.beforeEach((t) => {
  // 後端只能經 event.fetch 走代理；直接打全域 fetch 就是多了一個後端網址
  t.mock.method(globalThis, "fetch", () => assert.fail("不應呼叫全域 fetch"));
  delete process.env.VISITOR_HASH_SALT;
});

test("VISITOR_HASH_SALT 未設：回 204 且不呼叫後端", async () => {
  const e = event(JSON.stringify({ clinicId: CLINIC }));
  const res = await POST(e);
  assert.equal(res.status, 204);
  assert.equal(e.calls.length, 0);
});

test("有 salt：經代理送出當日雜湊，body 不含原始 IP", async () => {
  process.env.VISITOR_HASH_SALT = "test-salt";
  const e = event(JSON.stringify({ clinicId: CLINIC }));
  const res = await POST(e);
  assert.equal(res.status, 204);
  assert.equal(e.calls.length, 1);
  const [{ url, init }] = e.calls;
  assert.equal(url, `/api/v1/booking/clinics/${CLINIC}/view`);
  assert.equal(init.method, "POST");
  assert.equal(init.body.includes(IP), false);
  assert.equal(JSON.stringify(init.headers).includes(IP), false);
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
  const expected = createHash("sha256").update(`test-salt:${day}:${IP}`).digest("hex");
  assert.deepEqual(JSON.parse(init.body), { visitor_hash: expected });
});

test("壞 JSON、缺 clinicId 回 400；拿不到 IP 回 204 不記錄", async () => {
  process.env.VISITOR_HASH_SALT = "test-salt";
  assert.equal((await POST(event("{"))).status, 400);
  assert.equal((await POST(event("{}"))).status, 400);
  const noIp = event(JSON.stringify({ clinicId: CLINIC }), {});
  assert.equal((await POST(noIp)).status, 204);
  assert.equal(noIp.calls.length, 0);
});
