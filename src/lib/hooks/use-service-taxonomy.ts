"use client";

import { useEffect, useState } from "react";

import {
  FALLBACK_TAXONOMY,
  serviceCategoriesApi,
  type ServiceTaxonomy,
} from "@/lib/api/service-categories";

// 模組級快取：整個 app 只打一次 /service-categories，多元件共用
let cache: ServiceTaxonomy | null = null;
let inflight: Promise<ServiceTaxonomy> | null = null;

/**
 * client 元件取得服務分類字彙。
 * 首次回 FALLBACK_TAXONOMY（避免閃爍），抓到後自動更新並全域快取。
 */
export function useServiceTaxonomy(): ServiceTaxonomy {
  const [taxonomy, setTaxonomy] = useState<ServiceTaxonomy>(
    cache ?? FALLBACK_TAXONOMY,
  );

  useEffect(() => {
    // 初始 state 已用 cache（若有），這裡只需處理「尚未抓過」的情況
    if (cache) return;
    if (!inflight) {
      inflight = serviceCategoriesApi.get().then((t) => {
        cache = t;
        return t;
      });
    }
    let active = true;
    inflight.then((t) => {
      if (active) setTaxonomy(t);
    });
    return () => {
      active = false;
    };
  }, []);

  return taxonomy;
}
