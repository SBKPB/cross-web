// src 內 .svelte.ts 匯入 svelte 時改用這個模組：getContext／setContext 以 Map 實作，不需元件初始化階段，
// 其餘 API 原樣轉出（本檔不在 src 內，匯入的是真正的 svelte）
export * from "svelte";

const contexts = new Map();

export function setContext(key, value) {
  contexts.set(key, value);
  return value;
}

export function getContext(key) {
  return contexts.get(key);
}
