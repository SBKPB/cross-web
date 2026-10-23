<script lang="ts" module>
  import { tv, type VariantProps } from "tailwind-variants";

  export const tabsListVariants = tv({
    base: "group/tabs-list inline-flex h-auto min-h-11 w-fit max-w-full flex-wrap items-center justify-start gap-1 rounded-2xl border border-border p-1 text-muted-foreground group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none data-[variant=line]:border-0",
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  export type TabsListVariant = VariantProps<
    typeof tabsListVariants
  >["variant"];
</script>

<script lang="ts">
  import { Tabs as TabsPrimitive } from "bits-ui";
  import { cn } from "#lib/utils.js";

  let {
    ref = $bindable(null),
    variant = "default",
    class: className,
    ...restProps
  }: TabsPrimitive.ListProps & {
    variant?: TabsListVariant;
  } = $props();
</script>

<TabsPrimitive.List
  bind:ref
  data-slot="tabs-list"
  data-variant={variant}
  class={cn(tabsListVariants({ variant }), className)}
  {...restProps}
/>
