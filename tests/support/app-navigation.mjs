// $app/navigation 的測試替身：只記錄 goto 呼叫
export const gotoCalls = [];

export function goto(url, opts) {
  gotoCalls.push([url, opts]);
  return Promise.resolve();
}
