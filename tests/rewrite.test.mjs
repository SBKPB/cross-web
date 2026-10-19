import assert from "node:assert/strict";
import test from "node:test";

// 針對 Vercel preview 驗證 /api/v1 rewrite：未設 PREVIEW_URL 時略過
const PREVIEW_URL = process.env.PREVIEW_URL;

test("/api/v1 帶尾斜線不被 308 改寫並抵達後端", { skip: !PREVIEW_URL }, async () => {
  for (const p of ["/api/v1/service-categories", "/api/v1/service-categories/"]) {
    const r = await fetch(PREVIEW_URL + p, { redirect: "manual" });
    assert.notEqual(r.status, 308, p);
    assert.match(r.headers.get("content-type") ?? "", /json/, p);
  }
});
