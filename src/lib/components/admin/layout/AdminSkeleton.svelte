<script lang="ts">
  import { Skeleton } from "#lib/components/ui/skeleton/index.ts";
  let {
    label = "正在載入…",
    variant = "list",
  }: {
    label?: string;
    variant?:
      | "list"
      | "cards"
      | "table"
      | "dashboard"
      | "form"
      | "calendar"
      | "slots";
  } = $props();
</script>

<div
  role="status"
  aria-live="polite"
  aria-busy="true"
  data-admin-skeleton={variant}
  class="w-full min-w-0"
>
  <span class="sr-only">{label}</span>
  <div aria-hidden="true" class="space-y-4">
    {#if variant === "dashboard"}<div
        class="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {#each Array.from({ length: 4 }, (_, index) => index) as index (index)}<div
            class="rounded-2xl border border-border bg-card p-5"
          >
            <Skeleton class="mb-4 h-4 w-20" /><Skeleton
              class="h-9 w-16"
            /><Skeleton class="mt-3 h-3 w-24" />
          </div>{/each}
      </div>{/if}
    {#if variant === "cards" || variant === "dashboard"}<div
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {#each Array.from({ length: 3 }, (_, index) => index) as index (index)}<div
            class="space-y-5 rounded-2xl border border-border bg-card p-6"
          >
            <div class="flex items-center gap-3">
              <Skeleton class="size-12 rounded-2xl" />
              <div class="space-y-2">
                <Skeleton class="h-4 w-28" /><Skeleton class="h-3 w-20" />
              </div>
            </div>
            <Skeleton class="h-3 w-3/4" /><Skeleton class="h-3 w-1/2" />
            <div class="flex gap-2 border-t border-border pt-4">
              <Skeleton class="h-8 w-20 rounded-full" /><Skeleton
                class="h-8 w-16 rounded-full"
              />
            </div>
          </div>{/each}
      </div>
    {:else if variant === "form"}<div class="grid gap-5 sm:grid-cols-2">
        {#each Array.from({ length: 6 }, (_, index) => index) as index (index)}<div
            class="space-y-2"
          >
            <Skeleton class="h-3 w-20" /><Skeleton
              class="h-10 w-full rounded-2xl"
            />
          </div>{/each}
      </div>
    {:else if variant === "slots"}<div
        class="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {#each Array.from({ length: 8 }, (_, index) => index) as index (index)}<Skeleton
            class="h-10 rounded-xl"
          />{/each}
      </div>
    {:else if variant === "calendar"}<div
        class="overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div class="grid grid-cols-7 gap-3 border-b border-border p-4">
          {#each Array.from({ length: 7 }, (_, index) => index) as index (index)}<Skeleton
              class="h-4 w-full"
            />{/each}
        </div>
        <div class="grid grid-cols-7 gap-px bg-border">
          {#each Array.from({ length: 21 }, (_, index) => index) as index (index)}<div
              class="space-y-3 bg-card p-3"
            >
              <Skeleton class="h-3 w-1/2" /><Skeleton class="h-12 w-full" />
            </div>{/each}
        </div>
      </div>
    {:else}<div
        class="overflow-hidden rounded-2xl border border-border bg-card"
      >
        {#if variant === "table"}<div
            class="hidden grid-cols-5 gap-4 border-b border-border bg-muted/40 px-5 py-4 sm:grid"
          >
            {#each Array.from({ length: 5 }, (_, index) => index) as index (index)}<Skeleton
                class="h-3 w-3/4"
              />{/each}
          </div>{/if}{#each Array.from({ length: 5 }, (_, index) => index) as index (index)}<div
            class="flex items-center gap-4 border-b border-border/60 px-5 py-5 last:border-b-0"
          >
            <Skeleton class="size-10 shrink-0 rounded-xl" />
            <div class="min-w-0 flex-1 space-y-2">
              <Skeleton class="h-4 w-2/3 max-w-48" /><Skeleton
                class="h-3 w-1/2 max-w-32"
              />
            </div>
            <Skeleton class="hidden h-4 w-20 sm:block" /><Skeleton
              class="h-8 w-16 rounded-full"
            />
          </div>{/each}
      </div>{/if}
  </div>
</div>
