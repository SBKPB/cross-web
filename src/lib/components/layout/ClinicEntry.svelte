<script lang="ts">
  import { getAuth } from "#lib/auth/auth.svelte.ts";
  const auth = getAuth();
  import { afterNavigate } from "$app/navigation";
  import { Building2, ChevronDown } from "@lucide/svelte";
  import * as Popover from "#lib/components/ui/popover/index.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  let open = $state(false);
  afterNavigate(() => {
    open = false;
  });
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} disabled={auth.isLoading} variant="ghost" size="sm" class="min-h-11 gap-1">
        院所專區<ChevronDown class="size-3.5" aria-hidden="true" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content align="end" class="w-64 max-w-[calc(100vw-2rem)] p-3">
    <p class="flex items-center gap-2 px-2 py-2 text-sm font-semibold">
      <Building2 class="size-4 text-primary" />給院所與服務團隊
    </p>
    <nav aria-label="院所專區導覽" class="grid gap-1">
      <Button
        href="/join"
        variant="ghost"
        class="min-h-11 justify-start"
        onclick={() => (open = false)}
      >
        了解院所導入
      </Button>
      <Button
        href="/join#product-preview"
        variant="ghost"
        class="min-h-11 justify-start"
        onclick={() => (open = false)}
      >
        看看門面與管理方式
      </Button>
      <Button
        href="/pricing"
        variant="ghost"
        class="min-h-11 justify-start"
        onclick={() => (open = false)}
      >
        方案與費用
      </Button>
      <Button
        href="/admin/login"
        class="mt-2 min-h-11"
        onclick={() => (open = false)}
      >
        院所登入
      </Button>
    </nav>
  </Popover.Content>
</Popover.Root>
