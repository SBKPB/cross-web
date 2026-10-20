import { untrack } from "svelte";
import {
	FALLBACK_TAXONOMY,
	serviceCategoriesApi,
	type ServiceTaxonomy,
} from "../api/service-categories.ts";

// 服務分類字彙（移植自 use-service-taxonomy.ts）：模組級單一實例，整個 app 只打一次 /service-categories，多元件共用。
// 只在瀏覽器端抓取（useServiceTaxonomy 的 $effect 不會在 SSR 執行），伺服器上永遠回 FALLBACK_TAXONOMY，
// 與舊版 client 元件 SSR 的輸出相同，也不會跨請求共用狀態。
class ServiceTaxonomyCache {
	#value = $state.raw<ServiceTaxonomy | null>(null);
	#inflight: Promise<ServiceTaxonomy> | null = null;

	/** 目前的字彙：尚未抓到前為 FALLBACK_TAXONOMY（避免閃爍） */
	get current(): ServiceTaxonomy {
		return this.#value ?? FALLBACK_TAXONOMY;
	}

	/** 尚未抓過才發請求；並行呼叫共用同一個請求（serviceCategoriesApi.get 失敗時回 fallback，不會 reject） */
	load(): void {
		if (this.#value || this.#inflight) return;
		this.#inflight = serviceCategoriesApi.get().then((t) => {
			this.#value = t;
			return t;
		});
	}
}

const serviceTaxonomy = new ServiceTaxonomyCache();

/**
 * 元件取得服務分類字彙（舊版 useServiceTaxonomy hook）。需在元件初始化時呼叫。
 * 讀 `.current`：首次為 FALLBACK_TAXONOMY，抓到後自動更新並全域快取。
 */
export function useServiceTaxonomy(): { readonly current: ServiceTaxonomy } {
	$effect(() => {
		untrack(() => serviceTaxonomy.load());
	});
	return serviceTaxonomy;
}
