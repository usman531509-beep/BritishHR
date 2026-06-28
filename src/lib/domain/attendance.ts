// Attendance / Working Time Directive (WTD) engine. Pure, unit-tested.
// Hours are decimal; times are Date objects (UTC).

export const WTD_WEEKLY_LIMIT = 48; // average over the 17-week reference period
export const WTD_DAILY_REST_HOURS = 11; // min rest between shifts
export const WTD_BREAK_THRESHOLD_HOURS = 6; // >6h entitles a 20-min break

/** Worked hours for one entry: (out − in) − break, floored at 0. */
export function workedHours(clockIn: Date, clockOut: Date | null, breakMinutes = 0): number {
  if (!clockOut) return 0;
  const ms = clockOut.getTime() - clockIn.getTime();
  const hours = ms / 3_600_000 - breakMinutes / 60;
  return round2(Math.max(0, hours));
}

export interface WorkPeriod {
  clockIn: Date;
  clockOut: Date | null;
  breakMinutes?: number;
}

/** Total worked hours across periods. */
export function totalHours(periods: WorkPeriod[]): number {
  return round2(periods.reduce((s, p) => s + workedHours(p.clockIn, p.clockOut, p.breakMinutes ?? 0), 0));
}

/**
 * WTD average weekly hours over a reference period (default 17 weeks),
 * and whether it breaches the 48h average limit.
 */
export function wtdAverageWeekly(totalWorkedHours: number, weeksInReference = 17): { average: number; breaches: boolean } {
  const average = round2(totalWorkedHours / weeksInReference);
  return { average, breaches: average > WTD_WEEKLY_LIMIT };
}

/** A single week's compliance snapshot. */
export function weeklyCompliance(periods: WorkPeriod[]): {
  hours: number;
  breaches48: boolean;
} {
  const hours = totalHours(periods);
  return { hours, breaches48: hours > WTD_WEEKLY_LIMIT };
}

/** Daily rest: hours between the end of one shift and the start of the next. */
export function dailyRestHours(previousClockOut: Date, nextClockIn: Date): number {
  return round2((nextClockIn.getTime() - previousClockOut.getTime()) / 3_600_000);
}

export function restBreaches(previousClockOut: Date, nextClockIn: Date): boolean {
  return dailyRestHours(previousClockOut, nextClockIn) < WTD_DAILY_REST_HOURS;
}

/** Whether a shift of given hours legally requires a rest break. */
export function requiresRestBreak(hours: number): boolean {
  return hours > WTD_BREAK_THRESHOLD_HOURS;
}

/** Scheduled hours from "HH:MM" strings minus break. */
export function scheduledHours(startTime: string, endTime: string, breakMinutes = 0): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm) - breakMinutes;
  return round2(Math.max(0, mins / 60));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
