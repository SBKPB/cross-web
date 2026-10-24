import assert from "node:assert/strict";
import { test } from "node:test";
import {
  googleMapsUrl,
  googleMapsCoordinates,
  googleMapsPreview,
} from "../src/lib/maps/google-maps.ts";
import { resolveGoogleMapsLink } from "../src/lib/server/google-maps.ts";
import { POST } from "../src/routes/api/maps/resolve/+server.ts";

const point = { latitude: 25.0339, longitude: 121.5645 };
const place = new URL(
  "https://www.google.com/maps/place/測試院所/@24,120,15z/data=!4m6!3m5!1sfixture!8m2!3d25.0339!4d121.5645!16sfixture",
).href;
const short = "https://maps.app.goo.gl/FixturePlace";

test("地圖：長連結、編碼及座標查詢取精確標記，不取地圖視窗中心", () => {
  for (const value of [
    place,
    place.replace(/!/g, "%21"),
    "https://www.google.com/maps?data=!3d25.0339!4d121.5645",
    place.replace("www.google.com", "www.google.co.jp"),
    "https://maps.google.com/?q=25.0339,121.5645",
    "https://www.google.com/maps/search/?api=1&query=25.0339%2C121.5645",
    "https://www.google.com.tw/maps/place/25.0339,121.5645",
  ])
    assert.deepEqual(googleMapsCoordinates(value), point, value);
  for (const value of [
    "https://www.google.com/maps/@25.0339,121.5645,16z",
    "https://maps.google.com/?ll=25.0339,121.5645",
    "https://www.google.com/maps/search/?api=1&query=25,121&query_place_id=ChIJfixture",
    place.replace("/place/", "/dir/"),
    "https://www.google.com/maps?q=91,121",
    "https://www.google.com/maps?q=25,181",
    "https://www.google.com/maps?q=NaN,Infinity",
    "https://www.google.com/maps/place/%ZZ",
  ])
    assert.equal(googleMapsCoordinates(value), null, value);
  assert.deepEqual(googleMapsCoordinates("https://www.google.com/maps?q=0,0"), {
    latitude: 0,
    longitude: 0,
  });
  assert.deepEqual(
    googleMapsCoordinates("https://www.google.com/maps?q=-33.86,-151.2"),
    { latitude: -33.86, longitude: -151.2 },
  );
  assert.equal(
    googleMapsPreview(point),
    "https://www.google.com/maps/search/?api=1&query=25.0339,121.5645",
  );
});

test("地圖：拒絕任意網站、內部位址、憑證、非標準連接埠與 Google 一般轉址", () => {
  for (const input of [
    "not a url",
    "http://maps.google.com/?q=25,121",
    "https://google.com.evil.test/maps?q=25,121",
    "https://127.0.0.1/maps",
    "https://[::1]/maps",
    "https://user@www.google.com/maps",
    "https://www.google.com:8443/maps",
    "https://www.google.com/url?q=https://127.0.0.1",
    "https://goo.gl/not-maps",
    "https://maps.app.goo.gl/a/b",
    "https://www.google.com/maps" + "a".repeat(9000),
  ])
    assert.throws(() => googleMapsUrl(input));
  assert.equal(
    googleMapsUrl(" https://goo.gl/maps/Fixture ").hostname,
    "goo.gl",
  );
});

test("地圖：短連結逐跳展開，GET 不帶 Cookie／token，不讀 HTML", async () => {
  const calls = [];
  const result = await resolveGoogleMapsLink(short, async (url, init) => {
    calls.push({ url, init });
    return new Response(null, {
      status: 302,
      headers: {
        location: calls.length === 1 ? "https://goo.gl/maps/Fixture" : place,
      },
    });
  });
  assert.deepEqual(result, point);
  assert.equal(calls.length, 2);
  assert(
    calls.every(
      ({ init }) =>
        init.redirect === "manual" &&
        init.credentials === "omit" &&
        !init.headers.authorization,
    ),
  );
  const local = await resolveGoogleMapsLink(place, () =>
    assert.fail("長連結不需網路"),
  );
  assert.deepEqual(local, point);
});

test("地圖：每跳阻擋惡意轉址；過多跳轉、無位置與網路錯誤可重試", async () => {
  for (const destination of [
    "http://127.0.0.1/secret",
    "https://evil.test/maps",
    "https://www.google.com/url?q=http://localhost",
  ])
    await assert.rejects(
      resolveGoogleMapsLink(
        short,
        async () =>
          new Response(null, {
            status: 302,
            headers: { location: destination },
          }),
      ),
    );
  let calls = 0;
  await assert.rejects(
    resolveGoogleMapsLink(short, async () => {
      calls++;
      return new Response(null, { status: 302, headers: { location: short } });
    }),
  );
  assert.equal(calls, 5);
  await assert.rejects(
    resolveGoogleMapsLink(
      short,
      async () => new Response("HTML 不當作座標來源"),
    ),
  );
  await assert.rejects(
    resolveGoogleMapsLink(short, async () => {
      throw new Error("timeout");
    }),
  );
});

let userCounter = 0;
function event(
  body,
  {
    origin = "https://cross.twinhao.com",
    token = "Bearer fixture",
    role = "superadmin",
    status = 200,
    id = `maps-user-${++userCounter}`,
  } = {},
) {
  const calls = [];
  return {
    calls,
    url: new URL("https://cross.twinhao.com/api/maps/resolve"),
    request: new Request("https://cross.twinhao.com/api/maps/resolve", {
      method: "POST",
      headers: {
        origin,
        authorization: token,
        "content-type": "application/json",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    fetch: async (path, init) => {
      calls.push({ path, init });
      return Response.json(
        { id, roles: [role], facility_id: "fixture-clinic" },
        { status },
      );
    },
  };
}

test("位置解析 API：同源後台授權、私密快取、來源／角色／逾期權限檢查", async (t) => {
  t.mock.method(globalThis, "fetch", () =>
    assert.fail("帶座標長連結不應對外請求"),
  );
  const e = event({ url: place });
  const res = await POST(e);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), point);
  assert.equal(res.headers.get("cache-control"), "private, no-store");
  assert.equal(e.calls[0].path, "/api/v1/auth/me");
  for (const [opts, expected] of [
    [{ origin: "https://evil.test" }, 403],
    [{ token: "" }, 401],
    [{ role: "patient" }, 403],
    [{ status: 401 }, 401],
    [{ status: 503 }, 503],
  ])
    assert.equal((await POST(event({ url: short }, opts))).status, expected);
});

test("位置解析 API：限制輸入、解析失敗及頻率，不對未授權來源展開短網址", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: place } });
  });
  assert.deepEqual(await (await POST(event({ url: short }))).json(), point);
  assert.equal(calls, 1);
  for (const body of [
    "{",
    "null",
    { url: "https://evil.test/maps" },
    { url: 1 },
    { url: "a".repeat(13000) },
  ])
    assert.equal((await POST(event(body))).status, 400);
  assert.equal(calls, 1);
  const id = "maps-throttle-fixture";
  for (let i = 0; i < 12; i++)
    assert.equal((await POST(event({ url: place }, { id }))).status, 200);
  assert.equal((await POST(event({ url: place }, { id }))).status, 429);
});
