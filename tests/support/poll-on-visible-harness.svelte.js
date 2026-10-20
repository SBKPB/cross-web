// 在 $effect.root 內呼叫 pollOnVisible，enabled 由 $state 提供（模擬頁面狀態改變：預約變成非今日／已結束）。
import { flushSync } from "svelte";
import { pollOnVisible } from "../../src/lib/hooks/poll-on-visible.svelte.ts";

/**
 * @param {() => void} poll
 * @param {number} intervalMs
 * @param {boolean} initialEnabled
 */
export function mountPoll(poll, intervalMs, initialEnabled) {
  let enabled = $state(initialEnabled);
  const destroy = $effect.root(() => {
    pollOnVisible(poll, intervalMs, () => enabled);
  });
  flushSync();
  return {
    /** @param {boolean} next */
    setEnabled(next) {
      enabled = next;
      flushSync();
    },
    destroy,
  };
}
