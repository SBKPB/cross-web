// 對話框焦點測試（tests/dialog-focus.test.mjs）的掛載點：?case=<情境> 決定 Harness 渲染哪一種對話框
import { mount } from "svelte";
import Harness from "./Harness.svelte";

mount(Harness, {
	target: document.body,
	props: { scenario: new URLSearchParams(location.search).get("case") ?? "" },
});
