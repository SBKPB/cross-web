<script lang="ts">
  import type { Snippet } from "svelte";
  import { SquarePen } from "@lucide/svelte";
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  let {
    open = $bindable(false),
    title,
    description = "請確認資料後儲存。",
    busy = false,
    children,
  }: {
    open?: boolean;
    title: string;
    description?: string;
    busy?: boolean;
    children: Snippet;
  } = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="admin-dialog flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
    showCloseButton={!busy}
    onInteractOutside={(e) => {
      if (busy) e.preventDefault();
    }}
    onEscapeKeydown={(e) => {
      if (busy) e.preventDefault();
    }}
  >
    <Dialog.Header
      class="shrink-0 gap-3 border-b border-border/70 bg-muted/20 px-6 py-6 text-left"
    >
      <div
        data-admin-modal-icon
        class="mb-1 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"
      >
        <SquarePen class="size-5" strokeWidth={1.7} />
      </div>
      <Dialog.Title class="text-xl font-semibold tracking-tight">
        {title}
      </Dialog.Title><Dialog.Description class="pr-5 text-sm leading-6">
        {description}
      </Dialog.Description>
    </Dialog.Header>
    <div class="admin-form min-h-0 overflow-y-auto px-6 py-6">
      {@render children()}
    </div>
  </Dialog.Content>
</Dialog.Root>
