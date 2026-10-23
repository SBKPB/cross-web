<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Dialog from '#lib/components/ui/dialog/index.ts';
  let {open=$bindable(false),title,description='請確認資料後儲存。',busy=false,children}:{open?:boolean;title:string;description?:string;busy?:boolean;children:Snippet}=$props();
</script>
<Dialog.Root bind:open><Dialog.Content class="block max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl" showCloseButton={!busy} onInteractOutside={e=>{if(busy)e.preventDefault();}} onEscapeKeydown={e=>{if(busy)e.preventDefault();}}><Dialog.Header class="mb-5 pr-8"><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></Dialog.Header><div class="admin-form">{@render children()}</div></Dialog.Content></Dialog.Root>
<style>
.admin-form :global(label:not(:has(input[type=checkbox]))) {display:grid;gap:.4rem;font-size:.875rem;}
.admin-form :global(input:not([type=checkbox]):not([type=file])),.admin-form :global(select),.admin-form :global(textarea) {width:100%;border:1px solid var(--border);border-radius:.65rem;background:var(--background);padding:.6rem .75rem;font-size:.875rem;min-width:0;}
.admin-form :global(input:focus-visible),.admin-form :global(textarea:focus-visible),.admin-form :global(select:focus-visible){outline:2px solid var(--primary);outline-offset:2px;}
.admin-form :global(textarea){min-height:5rem;}
.admin-form :global(label:has(input[type=checkbox])){display:flex;align-items:center;gap:.5rem;font-size:.875rem;}
.admin-form :global(fieldset){min-width:0;}
.admin-form :global(legend){font-weight:600;margin-bottom:.75rem;}
</style>
