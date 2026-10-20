/**
 * 頁籤可見時才輪詢（移植自 use-poll-on-visible.ts）：每 intervalMs 觸發一次 poll（僅在 document 可見時），
 * 切回可見立即補一次；enabled 變為 false 或元件卸載時清掉 timer 與 listener。需在元件初始化時呼叫。
 *
 * @param poll 輪詢函式（在 tick 當下呼叫，不會因它而重設 timer）
 * @param enabled 回傳是否啟用的 getter；只有「值」改變時才重設 timer（對應舊版 useEffect 的 [enabled] 依賴）——
 *   getter 讀到的來源物件換新但值相同（例如每次進度回應都產生新的旗標物件）不會重設，輪詢節奏不漂移
 */
export function pollOnVisible(poll: () => void, intervalMs: number, enabled: () => boolean): void {
	const isEnabled = $derived(enabled());
	$effect(() => {
		if (!isEnabled) return;
		const tick = () => {
			if (document.visibilityState === "visible") poll();
		};
		const timer = setInterval(tick, intervalMs);
		document.addEventListener("visibilitychange", tick);
		return () => {
			clearInterval(timer);
			document.removeEventListener("visibilitychange", tick);
		};
	});
}
