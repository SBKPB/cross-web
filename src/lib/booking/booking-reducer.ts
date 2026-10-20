import type {
  BookingFormData,
  BookingSelection,
  DoctorOption,
  ServiceOption,
  TimeSlot,
} from "../types/booking.ts";
import { NO_PREFERENCE_DOCTOR } from "../constants/booking-constants.ts";

// 移植自舊版 components/booking/booking-context.tsx 的 reducer（行為逐條相同）。
// 每個動作回傳新物件、沒變的欄位沿用同一個參照：BookingFlow 以參照判斷服務／人員是否改變（是否重抓時段），
// 對應舊版 React useEffect 依賴比對。相對路徑 import：node --test 可直接載入本檔。

export interface BookingState {
  selection: BookingSelection;
  formData: BookingFormData;
  currentStep: 1 | 2 | 3;
}

export type BookingAction =
  | { type: "RESTORE_SELECTION"; payload: BookingSelection }
  | { type: "SET_SERVICE"; payload: ServiceOption }
  | { type: "SET_DOCTOR"; payload: DoctorOption }
  | { type: "SET_DATE"; payload: string }
  | { type: "SET_TIME_SLOT"; payload: TimeSlot }
  | { type: "SET_FORM_DATA"; payload: Partial<BookingFormData> }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; payload: 1 | 2 | 3 }
  | { type: "RESET" };

export const initialBookingState: BookingState = {
  selection: {
    service: null,
    doctor: NO_PREFERENCE_DOCTOR,
    date: null,
    timeSlot: null,
  },
  formData: {
    notes: "",
    privacyAccepted: false,
  },
  currentStep: 1,
};

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "RESTORE_SELECTION":
      return { ...initialBookingState, selection: action.payload, currentStep: 3 };
    case "SET_SERVICE":
      return {
        ...state,
        selection: { ...state.selection, service: action.payload, date: null, timeSlot: null },
      };
    case "SET_DOCTOR":
      return {
        ...state,
        selection: { ...state.selection, doctor: action.payload, date: null, timeSlot: null },
      };
    case "SET_DATE":
      return {
        ...state,
        selection: { ...state.selection, date: action.payload, timeSlot: null },
      };
    case "SET_TIME_SLOT":
      return {
        ...state,
        selection: { ...state.selection, timeSlot: action.payload },
      };
    case "SET_FORM_DATA":
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
      };
    case "NEXT_STEP":
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, 3) as 1 | 2 | 3,
      };
    case "PREV_STEP":
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1) as 1 | 2 | 3,
      };
    case "GO_TO_STEP":
      return {
        ...state,
        currentStep: action.payload,
      };
    case "RESET":
      return initialBookingState;
    default:
      return state;
  }
}
