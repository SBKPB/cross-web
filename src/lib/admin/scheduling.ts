import type { ApiAppointment, ApiSchedule, ApiStaffLeave, MedicalFacility } from '../types/clinic.ts';

export function addDateDays(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function validDate(value: string | null, fallback: string): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value ? value : fallback;
}
export function minutes(time: string): number {
  const [h, m, s = 0] = time.split(':').map(Number);
  return h * 60 + m + s / 60;
}
export function timeLabel(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}
export function appointmentEnd(a: ApiAppointment, fallback = 30): string {
  return timeLabel(minutes(a.appointment_time) + (a.duration_minutes ?? fallback));
}
export function apiMessage(error: unknown, fallback: string): string {
  const data = error && typeof error === 'object' && 'data' in error ? error.data as { detail?: unknown } : null;
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail)) {
    const first = data.detail[0] as { msg?: string } | undefined;
    if (first?.msg) return first.msg.replace(/^Value error,\s*/, '');
  }
  return fallback;
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
export interface SlotInput {
  date: string;
  staffId: string;
  duration: number;
  facility: MedicalFacility;
  schedules: ApiSchedule[];
  leaves: ApiStaffLeave[];
  appointments: ApiAppointment[];
  excludeId?: string;
  now?: Date;
}
/** 與後端規則一致：完整療程在班內、避開休息與預約；改期排除原預約，仍由後端鎖定後確認。 */
export function availableTimes(input: SlotInput): string[] {
  const { date, staffId, duration, facility, schedules, leaves, appointments, excludeId } = input;
  if (!staffId || duration <= 0 || facility.slot_duration <= 0 || leaves.some(l => l.staff_id === staffId && l.date === date)) return [];
  const hasHours = !!facility.business_hours && Object.keys(facility.business_hours).length > 0;
  const hours = facility.business_hours?.[WEEKDAYS[new Date(date + 'T12:00:00Z').getUTCDay()]];
  if (hasHours && !hours) return [];
  const open = hours ? minutes(hours.open) : 0;
  const close = hours ? minutes(hours.close) : 1440;
  const shifts = schedules.filter(s => s.staff_id === staffId && s.date === date && s.is_available);
  const intervals = shifts.length ? shifts.map(s => [Math.max(open, minutes(s.start_time)), Math.min(close, minutes(s.end_time))]) : [[open, close]];
  const now = input.now ?? new Date();
  const nowTaipei = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now);
  const today = nowTaipei.slice(0, 10), nowMinutes = minutes(nowTaipei.slice(11));
  if (date < today) return [];
  const startOfDay = Date.parse(date + 'T00:00:00Z');
  const busy = appointments.filter(a => a.id !== excludeId && a.staff_id === staffId && a.status !== 'cancelled').map(a => {
    const start = (Date.parse(a.appointment_date + 'T00:00:00Z') - startOfDay) / 60000 + minutes(a.appointment_time);
    return [start, start + (a.duration_minutes ?? facility.slot_duration)];
  });
  const result = new Set<string>();
  for (const [start, end] of intervals) {
    for (let t = start; t + duration <= end && t + duration < 1440; t += facility.slot_duration) {
      if (date === today && t <= nowMinutes) continue;
      if (hours?.breaks?.some(b => t < minutes(b.end) && t + duration > minutes(b.start))) continue;
      if (busy.some(([a, b]) => t < b && t + duration > a)) continue;
      result.add(timeLabel(t));
    }
  }
  return [...result].sort();
}
