// 在 $effect.root 內呼叫 requireMember，nextPath 由 $state 提供，模擬頁面參數（例如 [id]）改變。
// 本檔也會被 pnpm check 型別檢查：requireMember 的參數若改回 string，這裡傳 getter 會報錯。
import { flushSync } from "svelte";
import { requireMember, setAuth } from "../../src/lib/auth/auth.svelte.ts";

/** @param {string} initialPath */
export function mountRequireMember(initialPath) {
  const auth = setAuth();
  let path = $state(initialPath);
  /** @type {{ readonly ready: boolean } | undefined} */
  let guard;
  const destroy = $effect.root(() => {
    guard = requireMember(() => path);
  });
  flushSync();
  return {
    auth,
    /** @param {string} next */
    setPath(next) {
      path = next;
      flushSync();
    },
    /** @param {(auth: import("../../src/lib/auth/auth.svelte.ts").Auth) => void} fn */
    update(fn) {
      fn(auth);
      flushSync();
    },
    get ready() {
      return guard?.ready;
    },
    destroy,
  };
}
