<script lang="ts">
  import type { Snippet } from "svelte";
  import { Search, ClipboardList } from "@lucide/svelte";
  import * as Empty from "#lib/components/ui/empty/index.ts";
  let {
    title,
    description,
    search = false,
    children,
  }: {
    title: string;
    description: string;
    search?: boolean;
    children?: Snippet;
  } = $props();
</script>

<Empty.Root
  class="rounded-2xl border border-border bg-card px-5 py-10"
  data-admin-empty
>
  <Empty.Header>
    <Empty.Media variant="icon">
      {#if search}<Search />{:else}<ClipboardList />{/if}
    </Empty.Media><Empty.Title>{title}</Empty.Title><Empty.Description>
      {description}
    </Empty.Description>
  </Empty.Header>
  {#if children}<Empty.Content>{@render children()}</Empty.Content>{/if}
</Empty.Root>
