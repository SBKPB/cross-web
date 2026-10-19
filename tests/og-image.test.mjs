import assert from "node:assert/strict";
import test from "node:test";
import { isRedirect } from "@sveltejs/kit";

// 舊版分享圖網址 /opengraph-image?<hash>（Next 的 opengraph-image.tsx）已被各社群平台快取；
// 新版預設分享圖是靜態 /og.png，舊網址（含任意 query）一律 308 永久轉址過去，舊分享卡不會破圖。
const { GET } = await import("../src/routes/opengraph-image/+server.ts");

for (const path of ["/opengraph-image", "/opengraph-image?abc123", "/opengraph-image?v=1&x=%E4%B8%AD"]) {
  test(`${path} → 308 /og.png`, () => {
    const event = { url: new URL(`https://cross.twinhao.com${path}`) };
    let thrown;
    try {
      GET(event);
    } catch (e) {
      thrown = e;
    }
    assert.ok(isRedirect(thrown), `應丟出 SvelteKit redirect，實際：${thrown}`);
    assert.equal(thrown.status, 308);
    assert.equal(thrown.location, "/og.png");
  });
}
