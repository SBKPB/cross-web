import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { serializeJsonLd } from "../src/lib/seo/serialize-json-ld.ts";

test("店家 JSON-LD 的惡意內容無法建立額外 script 或 HTML 標籤", () => {
  for (const payload of [
    '</script><script>alert(1)</script>',
    '</ScRiPt><img src=x onerror=alert(1)>',
    '<!--<script>跨站腳本</script>',
  ]) {
    const data = { name: payload, address: { streetAddress: payload } };
    const json = serializeJsonLd(data);
    const html = renderToStaticMarkup(createElement("script", {
      type: "application/ld+json",
      dangerouslySetInnerHTML: { __html: json },
    }));
    assert.equal((html.match(/<\/script>/gi) ?? []).length, 1);
    assert.equal((html.match(/<script\b/gi) ?? []).length, 1);
    assert.equal(html.includes("<img"), false);
    assert.deepEqual(JSON.parse(json), data);
  }
});

test("安全序列化保留中文、引號、特殊符號與結構化資料", () => {
  const data = {
    "@context": "https://schema.org",
    "@graph": [{ name: '安心「診所」 & <預約>', description: "換行\n與分隔\u2028符號", rating: 4.5, active: true, address: null }],
  };
  assert.deepEqual(JSON.parse(serializeJsonLd(data)), data);
});
