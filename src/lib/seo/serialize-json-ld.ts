/** 防止店家資料中的 HTML 結束 JSON-LD script 標籤，並保留原始 JSON 內容。 */
export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** 完整的 JSON-LD script 標籤，供 Svelte `{@html}` 輸出（內容已經 serializeJsonLd 跳脫）。 */
export function jsonLdScript(value: object): string {
  return `<script type="application/ld+json">${serializeJsonLd(value)}</script>`;
}
