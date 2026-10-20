// 還原舊版（Radix Dialog，shadcn/ui 的 Dialog、Sheet 都用它）開啟與關閉時的焦點規則，給 Bits UI Dialog.Content 用。
//
// 開啟（Radix FocusScope）：
// - 依 DOM 順序找可 Tab 的元素（tabIndex >= 0，略過 disabled、hidden 與 type=hidden 的 input），
//   再拿掉所有 <a>（Radix removeLinks），逐一 focus，第一個真的取得焦點的就停；若是 <input> 一併全選
// - 都沒有就聚焦內容容器本身
// Bits UI 預設是直接聚焦第一個可 Tab 的元素（含連結）：診所詳情對話框因此聚焦「查看可約時段」連結，
// 鍵盤使用者再按 Enter 就跳去預約頁；舊版聚焦關閉鈕，Enter 是關閉對話框。
//
// 關閉（Radix DialogContentModal）：只把焦點還給這個對話框的 Trigger；沒有 Trigger（由外部按鈕受控開啟，
// 例如診所詳情、分享對話框）就不移動焦點，焦點隨被移除的內容落到 body。
// Bits UI 預設是還給開啟前聚焦的元素。
//
// 確認對話框（Radix AlertDialog，variant "alert-dialog"）：開啟時改為聚焦「取消」鈕（AlertDialog.Cancel，
// focus({ preventScroll: true })，沒有取消鈕就不移動焦點）；Bits UI 預設聚焦內容容器。關閉規則與 Dialog 相同。

/** Radix getTabbableCandidates：不檢查可見性，focus 失敗（例如 display:none）就換下一個 */
function tabbableCandidates(container: HTMLElement): HTMLElement[] {
	const nodes: HTMLElement[] = [];
	const walker = container.ownerDocument.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
		acceptNode: (node) => {
			const el = node as HTMLElement & { disabled?: boolean };
			const isHiddenInput = el instanceof HTMLInputElement && el.type === "hidden";
			if (el.disabled || el.hidden || isHiddenInput) return NodeFilter.FILTER_SKIP;
			return el.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
		},
	});
	while (walker.nextNode()) nodes.push(walker.currentNode as HTMLElement);
	return nodes;
}

/** Radix focus：不捲動；焦點真的移到 input 上才全選 */
function focusElement(el: HTMLElement, select = false): void {
	const previous = el.ownerDocument.activeElement;
	el.focus({ preventScroll: true });
	if (select && el !== previous && el instanceof HTMLInputElement) el.select();
}

/** 依 Radix 規則聚焦 container 內第一個非連結的可 Tab 元素，都沒有就聚焦 container */
export function focusFirstNonLink(container: HTMLElement): void {
	const doc = container.ownerDocument;
	const previous = doc.activeElement;
	for (const el of tabbableCandidates(container)) {
		if (el.tagName === "A") continue;
		focusElement(el, true);
		if (doc.activeElement !== previous) return;
	}
	focusElement(container);
}

type AutoFocusHandler = ((event: Event) => void) | undefined;

/** Bits 的 Dialog 與 AlertDialog 共用同一個 primitive，部件屬性名稱依 variant 而不同（data-dialog-trigger / data-alert-dialog-trigger） */
type DialogVariant = "dialog" | "alert-dialog";

/**
 * 每個 Content 元件實例建立一次，`getContainer` 回傳內容節點（bind:ref）。
 * 兩個處理器都先呼叫呼叫端傳入的同名處理器，它 preventDefault 就完全不動焦點（與 Bits、Radix 相同）；
 * 否則取消 Bits 的預設，改用 Radix 的規則。
 */
export function radixAutoFocus(getContainer: () => HTMLElement | null, variant: DialogVariant = "dialog") {
	return {
		onOpen(event: Event, handler: AutoFocusHandler): void {
			handler?.(event);
			if (event.defaultPrevented) return;
			event.preventDefault();
			// 與 Bits 預設同時機（下一個 frame，內容已渲染）；屆時已關閉移除、或焦點已在內容裡（子元件自行 focus）就不動
			requestAnimationFrame(() => {
				const container = getContainer();
				if (!container?.isConnected) return;
				if (container.contains(container.ownerDocument.activeElement)) return;
				if (variant === "alert-dialog") {
					// Radix AlertDialogContent：cancelRef.current?.focus({ preventScroll: true })
					container.querySelector<HTMLElement>("[data-alert-dialog-cancel]")?.focus({ preventScroll: true });
					return;
				}
				focusFirstNonLink(container);
			});
		},
		onClose(event: Event, handler: AutoFocusHandler): void {
			handler?.(event);
			if (event.defaultPrevented) return;
			event.preventDefault();
			// 關閉的當下內容節點仍在（Bits 先停用 FocusScope 才移除內容）。
			// Bits Trigger 帶 data-<variant>-trigger 與 aria-controls=<內容 id>（Dialog、Sheet、AlertDialog 同一個 primitive）
			const id = getContainer()?.id;
			if (!id) return;
			const trigger = document.querySelector<HTMLElement>(
				`[data-${variant}-trigger][aria-controls="${CSS.escape(id)}"]`
			);
			trigger?.focus();
		},
	};
}
