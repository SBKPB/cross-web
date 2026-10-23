// 對應舊版 <html data-scroll-behavior="smooth">：全站 CSS 是 scroll-behavior: smooth（同頁錨點平滑捲動），
// 但換頁時 Next 會暫時改成 auto，新頁面直接回到頂端，不會從上一頁的位置慢慢滑上去；純 hash 變化則維持平滑。
// root layout 在 beforeNavigate 呼叫 createSmoothScrollPause 回傳的函式。

export interface ScrollRoot {
  style: { scrollBehavior: string };
}

/** SvelteKit BeforeNavigate 用得到的欄位（測試可用假物件） */
export interface NavigationLike {
  from: { url: URL } | null;
  to: { url: URL } | null;
  willUnload: boolean;
  complete: Promise<void>;
}

/** 同 path + search、目標帶 hash：瀏覽器原生錨點捲動，不算換頁 */
export function isHashOnlyNavigation(from: URL, to: URL): boolean {
  return (
    from.origin === to.origin &&
    from.pathname === to.pathname &&
    from.search === to.search &&
    to.hash !== ""
  );
}

/** 收 pageshow 事件的對象（瀏覽器端傳 window；測試可用 EventTarget） */
export interface PageShowTarget {
  addEventListener(type: "pageshow", listener: (event: Event) => void): void;
}

/**
 * 回傳「導航期間暫停平滑捲動」的函式。除了純 hash 導航外一律暫停，
 * 在 navigation.complete settle（完成、被取消或被新導航中止）時還原。
 * 多個導航重疊時以計數器追蹤，最後一個 settle 才還原，避免進行中的導航又變回平滑。
 * willUnload（離開本站、整頁重新載入）不處理：complete 永遠不會 settle，頁面也不會在本站捲動。
 *
 * 換頁途中改走整頁載入（willUnload 為 false 但頁面被帶走）時 complete 也不會 settle，之後從 bfcache 還原的頁面
 * 會停在 auto、計數卡住。傳入 `win`（瀏覽器端的 window）時，pageshow 的 event.persisted 為 true 就重置計數並還原；
 * 重置前發出的導航之後才 settle 也不再計入。SSR 期間建立時不傳（沒有 window）。
 */
export function createSmoothScrollPause(
  getRoot: () => ScrollRoot,
  win?: PageShowTarget,
): (navigation: NavigationLike) => void {
  let pending = 0;
  let generation = 0;
  win?.addEventListener("pageshow", (event) => {
    if (!(event as PageTransitionEvent).persisted) return;
    generation++;
    pending = 0;
    getRoot().style.scrollBehavior = "";
  });
  return (navigation) => {
    const { from, to } = navigation;
    if (!to || navigation.willUnload) return;
    if (from && isHashOnlyNavigation(from.url, to.url)) return;

    const root = getRoot();
    const started = generation;
    pending++;
    root.style.scrollBehavior = "auto";
    navigation.complete
      .finally(() => {
        if (started !== generation) return;
        if (--pending === 0) root.style.scrollBehavior = "";
      })
      // 取消／中止時 complete 會 reject：上面的 finally 已還原，這裡只避免未處理的 rejection
      .catch(() => {});
  };
}
