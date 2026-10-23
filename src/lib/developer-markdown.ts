import { Marked } from 'marked';
import { developerDocLink } from './developers.ts';

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** 僅渲染文件語法；原始 HTML 一律當文字，連結沿用既有允許清單。 */
const markdown = new Marked({ gfm: true, async: false, renderer: {
  html({ text }) { return escape(text); },
  link({ href, title, tokens }) {
    const target = developerDocLink(href);
    const text = this.parser.parseInline(tokens);
    return target ? `<a href="${escape(target)}"${title ? ` title="${escape(title)}"` : ''}>${text}</a>` : text;
  },
  image({ href, text }) {
    const target = developerDocLink(href);
    return target ? `<img src="${escape(target)}" alt="${escape(text)}" loading="lazy">` : escape(text);
  },
  heading({ depth, text, tokens }) {
    const id = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
    return `<h${depth} id="${escape(id)}">${this.parser.parseInline(tokens)}</h${depth}>`;
  },
  code({ text, lang }) {
    return `<div class="developer-code"><div class="developer-code-bar"><span>${escape(lang || '範例')}</span><button type="button" data-copy-code aria-label="複製程式碼">複製</button></div><pre tabindex="0"><code>${escape(text)}</code></pre><span role="status" class="sr-only"></span></div>`;
  },
}});

export function renderDeveloperMarkdown(source: string): string {
  return markdown.parse(source) as string;
}
