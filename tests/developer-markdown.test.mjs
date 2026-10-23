import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDeveloperMarkdown } from '../src/lib/developer-markdown.ts';

test('文件跳脫原始 HTML，拒絕腳本協定與未允許的圖片連結', () => {
  for (const source of ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '[點我](javascript:alert%281%29)', '![圖片](javascript:alert%281%29)', '<iframe srcdoc="<script>alert(1)</script>"></iframe>']) {
    const html = renderDeveloperMarkdown(source);
    assert.doesNotMatch(html, /<(script|img|iframe)\b/i);
    assert.doesNotMatch(html, /(?:href|src)=["']javascript:/i);
  }
  assert.doesNotMatch(renderDeveloperMarkdown('[連結](https://example.com/\"onclick=alert%281%29)'), /href="[^"]*"onclick=/i);
});
test('GFM、內部文件、程式碼及標題錨點可渲染', () => {
  const html = renderDeveloperMarkdown('# 快速開始\n\n[API](api.md)\n\n```js\n<script>sample</script>\n```\n\n| 欄位 | 用途 |\n| --- | --- |\n| id | 編號 |');
  assert.match(html, /id="快速開始"/);
  assert.match(html, /href="\/developers\/docs\/api"/);
  assert.match(html, /&lt;script&gt;sample&lt;\/script&gt;/);
  assert.match(html, /data-copy-code/);
  assert.match(html, /<table>/);
});
