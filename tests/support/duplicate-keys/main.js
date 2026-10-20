// 後端重複資料渲染測試（tests/duplicate-keys.test.mjs）的掛載點：
// 掛載或之後的 effect 丟出的錯誤（Svelte 的 each_key_duplicate 會在這裡出現）記在 <html data-errors>，掛載完成設 data-mounted
import { flushSync, mount } from "svelte";
import Harness from "./Harness.svelte";

const root = document.documentElement;
/** @type {string[]} */
const errors = [];
const record = (/** @type {unknown} */ error) => {
	errors.push(error instanceof Error ? error.message : String(error));
	root.dataset.errors = JSON.stringify(errors);
};
root.dataset.errors = "[]";
window.addEventListener("error", (e) => record(e.error ?? e.message));
window.addEventListener("unhandledrejection", (e) => record(e.reason));
try {
	mount(Harness, { target: /** @type {HTMLElement} */ (document.getElementById("app")) });
	flushSync();
} catch (e) {
	record(e);
}
root.dataset.mounted = "true";
