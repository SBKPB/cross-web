import type { BookableDate } from "../types/booking.ts";

/**
 * 可預約時段的載入狀態（移植自舊版 booking-flow.tsx 的 loadSlots 與 slotsRequest ref）。
 * 每次 load 取得新的請求序號，只有最新一次請求的結果、錯誤與 loading 結束會套用；
 * cancel（對應舊版 effect 清除時 slotsRequest.current += 1）讓進行中的請求整個作廢，loading 維持原狀（同舊版）。
 */
export class AvailableSlots {
  // 整批替換、不就地修改：用 raw 避免深層 proxy
  dates = $state.raw<BookableDate[]>([]);
  isLoading = $state(false);
  error = $state(false);

  #request = 0;

  load(fetcher: () => Promise<BookableDate[]>): void {
    const requestId = ++this.#request;
    this.isLoading = true;
    this.error = false;
    fetcher()
      .then((dates) => {
        if (requestId === this.#request) this.dates = dates;
      })
      .catch((error) => {
        if (requestId !== this.#request) return;
        console.error("Failed to load available slots:", error);
        this.error = true;
        this.dates = [];
      })
      .finally(() => {
        if (requestId === this.#request) this.isLoading = false;
      });
  }

  cancel(): void {
    this.#request += 1;
  }
}
