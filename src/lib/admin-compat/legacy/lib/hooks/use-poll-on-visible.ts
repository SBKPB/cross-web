import { useEffect } from "react";

/**
 * 頁籤可見時才輪詢：每 intervalMs 觸發一次 poll（僅在 document 可見時），切回可見立即
 * 補一次；enabled=false 或元件卸載時清掉 timer 與 listener。
 *
 * 注意：poll 請以 useCallback 穩定參考傳入，否則每次 render 都會重設 timer。
 */
export function usePollOnVisible(
  poll: () => void,
  intervalMs: number,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === "visible") poll();
    };
    const timer = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [poll, intervalMs, enabled]);
}
