import { error } from '@sveltejs/kit';
import { developerDocuments } from '$lib/developers';
import { renderDeveloperMarkdown } from '$lib/developer-markdown';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
  const index = developerDocuments.findIndex(document => document.slug === params.slug);
  if (index < 0) error(404, '文件不存在');
  const document = developerDocuments[index];
  return { document, next: developerDocuments[index + 1] ?? null, html: renderDeveloperMarkdown(document.markdown), seo: {
    title: `${document.title} · 開發者`, description: document.description, canonical: `/developers/docs/${document.slug}`,
    openGraph: { title: `${document.title} · Cross 開發者`, url: `/developers/docs/${document.slug}` },
  } };
};
