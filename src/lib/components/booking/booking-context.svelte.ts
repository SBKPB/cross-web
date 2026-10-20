import { getContext, setContext, untrack } from "svelte";
import {
  bookingReducer,
  initialBookingState,
  type BookingAction,
  type BookingState,
} from "$lib/booking/booking-reducer";

/**
 * 預約流程狀態（移植自舊版 booking-context.tsx 的 BookingProvider / useBooking / useBookingDispatch）。
 * state 以 $state.raw 存整份不可變物件，每次 dispatch 由 reducer 換成新物件：
 * 沒變的欄位保留同一個參照，下游以 $derived 取 selection.service 等欄位時，只有真的換了才會觸發（同 React 依賴比對）。
 */
export class BookingStore {
  state = $state.raw<BookingState>(initialBookingState);

  // 讀目前 state 時不追蹤：在 $effect 內 dispatch（例如還原暫存選擇）不會讓該 effect 依賴整份 state
  dispatch = (action: BookingAction): void => {
    this.state = bookingReducer(
      untrack(() => this.state),
      action,
    );
  };
}

const BOOKING_KEY = Symbol("booking");

/** 預約頁呼叫一次（對應舊版 <BookingProvider>） */
export function setBookingStore(): BookingStore {
  return setContext(BOOKING_KEY, new BookingStore());
}

export function getBookingStore(): BookingStore {
  const store = getContext<BookingStore | undefined>(BOOKING_KEY);
  if (!store) {
    throw new Error("getBookingStore must be used within a BookingProvider");
  }
  return store;
}
