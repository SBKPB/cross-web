// 門診排班（對應後端 /api/v1/booking/clinics/{id}/schedule）

// 診次：早診 / 午診 / 晚診（對齊後端 SessionType）
export type ScheduleSession = "morning" | "afternoon" | "evening";

export interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  weekday: number; // 0=週一 ... 6=週日
  session: ScheduleSession;
  start_time: string; // "09:00"
  end_time: string; // "12:00"
  doctor_id: string;
  doctor_name: string;
  department: string;
  avatar?: string | null;
}

export interface WeeklySchedule {
  week_start: string; // 週一 YYYY-MM-DD
  week_end: string; // 週日 YYYY-MM-DD
  week_offset: number;
  entries: ScheduleEntry[];
}
