"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import type {
  BookingSelection,
  BookingFormData,
  ServiceOption,
  DoctorOption,
  TimeSlot,
} from "@/types/booking";
import { NO_PREFERENCE_DOCTOR } from "@/lib/constants/booking-constants";

interface BookingState {
  selection: BookingSelection;
  formData: BookingFormData;
  currentStep: 1 | 2 | 3;
}

type BookingAction =
  | { type: "SET_SERVICE"; payload: ServiceOption }
  | { type: "SET_DOCTOR"; payload: DoctorOption }
  | { type: "SET_DATE"; payload: string }
  | { type: "SET_TIME_SLOT"; payload: TimeSlot }
  | { type: "SET_FORM_DATA"; payload: Partial<BookingFormData> }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; payload: 1 | 2 | 3 }
  | { type: "RESET" };

const initialState: BookingState = {
  selection: {
    service: null,
    doctor: NO_PREFERENCE_DOCTOR,
    date: null,
    timeSlot: null,
  },
  formData: {
    name: "",
    gender: null,
    birthDate: "",
    phone: "",
    notes: "",
    privacyAccepted: false,
  },
  currentStep: 1,
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "SET_SERVICE":
      return {
        ...state,
        selection: { ...state.selection, service: action.payload },
      };
    case "SET_DOCTOR":
      return {
        ...state,
        selection: { ...state.selection, doctor: action.payload },
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
      return initialState;
    default:
      return state;
  }
}

const BookingContext = createContext<BookingState | null>(null);
const BookingDispatchContext = createContext<Dispatch<BookingAction> | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  return (
    <BookingContext.Provider value={state}>
      <BookingDispatchContext.Provider value={dispatch}>
        {children}
      </BookingDispatchContext.Provider>
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}

export function useBookingDispatch() {
  const context = useContext(BookingDispatchContext);
  if (!context) {
    throw new Error("useBookingDispatch must be used within a BookingProvider");
  }
  return context;
}
