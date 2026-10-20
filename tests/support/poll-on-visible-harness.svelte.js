// 在 $effect.root 內呼叫 pollOnVisible，enabled 由 $state 提供（模擬頁面狀態改變：預約變成非今日／已結束）。
import { flushSync } from "svelte";
import { pollOnVisible } from "../../src/lib/hooks/poll-on-visible.svelte.ts";

/**
 * @param {() => void} poll
 * @param {number} intervalMs
 * @param {boolean} initialEnabled
 */
export function mountPoll(poll, intervalMs, initialEnabled) {
  // 與預約詳情頁相同：enabled 從一個每次都換新物件的狀態讀出（進度回應每次都是新物件）
  let flags = $state.raw({ shouldPoll: initialEnabled });
  const destroy = $effect.root(() => {
    pollOnVisible(poll, intervalMs, () => flags.shouldPoll);
  });
  flushSync();
  return {
    /** @param {boolean} next 換成新的物件（值可能相同） */
    setEnabled(next) {
      flags = { shouldPoll: next };
      flushSync();
    },
    destroy,
  };
}
