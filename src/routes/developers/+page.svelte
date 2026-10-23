<script lang="ts">
  import { developerDocuments, developerPreviewVersion, developerRepository } from '$lib/developers';
  import { renderDeveloperMarkdown } from '$lib/developer-markdown';
  import DeveloperDocument from '$lib/components/developers/DeveloperDocument.svelte';
  import { Button } from '$lib/components/ui/button';
  import Seo from '$lib/components/Seo.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const example = renderDeveloperMarkdown('```Python 客戶端\npython examples/python/upload.py --kind ecg\n```');
</script>

<Seo {...data.seo} />

<section class="border-b border-border bg-card">
  <div class="home-container grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
    <div class="min-w-0">
      <p class="home-eyebrow">CROSS DEVELOPERS / PREVIEW {developerPreviewVersion}</p>
      <h1 class="mt-5 text-4xl font-semibold leading-[1.3] tracking-tight sm:text-5xl">從第一筆事件，<br />開始串接。</h1>
      <p class="mt-5 max-w-xl text-base leading-8 text-muted-foreground">不需要設備或預約帳號，先用合成資料驗證登錄、接收、重送與原生讀回。每份文件都對應目前可執行的沙盒。</p>
      <div class="mt-7 flex flex-wrap gap-3">
        <Button href="/developers/docs/quickstart" size="lg">快速開始 →</Button>
        <Button href={developerRepository} target="_blank" rel="noopener noreferrer" variant="outline" size="lg">GitHub 文件庫 ↗</Button>
      </div>
      <p class="mt-5 text-xs leading-6 text-muted-foreground">本機 Developer Preview · Python 3.14 · Node.js 22</p>
    </div>
    <div class="min-w-0">
      <p class="mb-3 text-xs font-medium text-muted-foreground">啟動服務後，執行你的第一筆 ECG</p>
      <DeveloperDocument html={example} />
      <div class="mt-4 rounded-2xl border border-border bg-muted/30 px-5 py-4 font-mono text-xs leading-7">
        <p class="text-primary">登錄 → 上傳 → 原樣重送 → 原生讀回</p><p class="mt-1 text-muted-foreground">同一 event_id，保留同一筆紀錄。</p>
      </div>
      <p class="mt-4 text-xs leading-6 text-muted-foreground">請先依快速開始啟動本機服務並設定授權碼。這是範例客戶端，不是正式 SDK。</p>
    </div>
  </div>
</section>
<section class="home-container py-14 sm:py-20">
  <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p class="home-eyebrow">DOCUMENTATION</p><h2 class="mt-3 text-2xl font-semibold tracking-tight">從流程到資料細節。</h2></div><a href="/developers/openapi.json" download class="text-sm font-medium text-primary">下載 OpenAPI 3.1</a></div>
  <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each developerDocuments as document, index (document.slug)}
      <article class="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"><span class="font-mono text-xs text-primary">0{index + 1}</span><h3 class="mt-4 text-lg font-semibold"><a href={`/developers/docs/${document.slug}`} class="hover:text-primary">{document.title} →</a></h3><p class="mt-2 text-sm leading-7 text-muted-foreground">{document.description}</p></article>
    {/each}
  </div>
</section>
<section class="home-container pb-16"><div class="grid gap-6 rounded-4xl border border-border bg-card p-7 sm:p-10 md:grid-cols-[1fr_auto]"><div><h2 class="text-xl font-semibold">一次取得完整範例。</h2><p class="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">文件、合成資料、OpenAPI、獨立參考服務與兩種語言客戶端都在同一包。下載後可在本機執行完整驗證。</p><p class="mt-4 text-xs leading-6 text-muted-foreground">目前沒有公開託管量測 API；真實設備、正式身份、多租戶與 FHIR 交換仍依後續合作交付。</p></div><Button href="/developers/cross-developers-preview.zip" download variant="outline" class="self-start">下載 Preview {developerPreviewVersion}</Button></div></section>
