<script lang="ts">
  import { developerDocuments, developerRepository } from '$lib/developers';
  import DeveloperDocument from '$lib/components/developers/DeveloperDocument.svelte';
  import Seo from '$lib/components/Seo.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>
<Seo {...data.seo} />
<div class="home-container py-8 sm:py-12">
  <a href="/developers" class="text-xs font-medium text-muted-foreground hover:text-primary">← 開發者入口</a>
  <div class="mt-8 grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
    <aside class="min-w-0 lg:sticky lg:top-28"><nav aria-label="開發者文件" class="space-y-1"><p class="mb-4 px-4 font-mono text-xs text-muted-foreground">DEVELOPER PREVIEW</p>{#each developerDocuments as document (document.slug)}<a href={`/developers/docs/${document.slug}`} aria-current={data.document.slug === document.slug ? 'page' : undefined} class={`block rounded-xl px-4 py-2.5 text-sm transition ${data.document.slug === document.slug ? 'bg-accent/60 font-medium text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{document.title}</a>{/each}</nav></aside>
    <article class="min-w-0 max-w-4xl"><DeveloperDocument html={data.html} /><div class="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6"><a href={`${developerRepository}/blob/main/docs/${data.document.slug}.md`} target="_blank" rel="noopener noreferrer" class="text-xs text-muted-foreground hover:text-primary">在 GitHub 查看來源 ↗</a>{#if data.next}<a href={`/developers/docs/${data.next.slug}`} class="text-sm font-medium text-primary">下一篇：{data.next.title} →</a>{:else}<a href="/join" class="text-sm font-medium text-primary">了解院所導入</a>{/if}</div></article>
  </div>
</div>
