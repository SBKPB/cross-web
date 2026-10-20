// 在 $effect.root 內模擬多個呼叫 useServiceTaxonomy 的元件。本檔也會被 pnpm check 型別檢查。
import { flushSync } from "svelte";
import { useServiceTaxonomy } from "../../src/lib/hooks/service-taxonomy.svelte.ts";

/** @param {number} [consumers] */
export function mountServiceTaxonomy(consumers = 1) {
  /** @type {ReturnType<typeof useServiceTaxonomy>[]} */
  const stores = [];
  const destroy = $effect.root(() => {
    for (let i = 0; i < consumers; i++) stores.push(useServiceTaxonomy());
  });
  flushSync();
  return { stores, destroy };
}
