<script lang="ts">
  import { onMount } from 'svelte';
  let { html }: { html: string } = $props();
  let element: HTMLDivElement;
  onMount(() => {
    const copy = async (event: MouseEvent) => {
      const button = (event.target as Element)?.closest<HTMLButtonElement>('button[data-copy-code]');
      if (!button || !element.contains(button)) return;
      const block = button.closest('.developer-code');
      const status = block?.querySelector('[role="status"]');
      try {
        await navigator.clipboard.writeText(block?.querySelector('code')?.textContent ?? '');
        button.textContent = '已複製';
        if (status) status.textContent = '程式碼已複製。';
      } catch {
        if (status) { status.classList.remove('sr-only'); status.textContent = '無法自動複製，請選取程式碼手動複製。'; }
      }
    };
    element.addEventListener('click', copy);
    return () => element.removeEventListener('click', copy);
  });
</script>

<!-- html 僅來自 renderDeveloperMarkdown；原始 HTML 跳脫，連結與圖片限制協定，另有惡意輸入回歸測試。 -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<div bind:this={element} class="developer-document space-y-6 text-sm leading-8 text-foreground">{@html html}</div>

<style>
  :global(.developer-document h1) { font-size: clamp(1.875rem, 4vw, 2.25rem); font-weight: 600; letter-spacing: -.025em; line-height: 1.4; }
  :global(.developer-document h2) { padding-top: 1.75rem; font-size: 1.25rem; font-weight: 600; scroll-margin-top: 7rem; }
  :global(.developer-document h3) { padding-top: .75rem; font-size: 1.125rem; font-weight: 600; }
  :global(.developer-document p), :global(.developer-document li) { color: var(--muted-foreground); }
  :global(.developer-document ul), :global(.developer-document ol) { padding-left: 1.5rem; list-style: disc; }
  :global(.developer-document ol) { list-style: decimal; }
  :global(.developer-document li + li) { margin-top: .5rem; }
  :global(.developer-document a) { color: var(--primary); text-decoration: underline; text-underline-offset: 4px; }
  :global(.developer-document pre) { padding: 1.25rem; overflow-x: auto; line-height: 1.75rem; }
  :global(.developer-document code) { font-family: var(--font-mono); overflow-wrap: anywhere; }
  :global(.developer-document p code), :global(.developer-document li code) { border-radius: .375rem; padding: .125rem .375rem; background: var(--muted); }
  :global(.developer-document .developer-code) { overflow: hidden; border: 1px solid var(--border); border-radius: 1rem; background: color-mix(in oklab, var(--muted) 30%, transparent); }
  :global(.developer-document .developer-code-bar) { display: flex; justify-content: space-between; padding: .5rem 1rem; border-bottom: 1px solid var(--border); color: var(--muted-foreground); font-size: .75rem; }
  :global(.developer-document button[data-copy-code]) { border-radius: .5rem; padding: 0 .5rem; cursor: pointer; color: var(--foreground); }
  :global(.developer-document table) { display: block; overflow-x: auto; width: 100%; text-align: left; border-collapse: collapse; }
  :global(.developer-document th), :global(.developer-document td) { padding: .75rem 1rem; border-bottom: 1px solid var(--border); vertical-align: top; }
  :global(.developer-document thead) { background: var(--muted); }
</style>
