// UK statutory leave & holiday-entitlement engine. Pure, framework-agnostic,
// unit-tested. All "days" are working days.

export const STATUTORY_WEEKS = 5.6;
export const STATUTORY_DAY_CAP = 28; // 5.6 weeks is capped at 28 days by law

/**
 * Full-year statutory holiday entitlement (working days) for an employee,
 * given their working pattern and FTE. UK law: 5.6 weeks, capped at 28 days
 * for those working 5+ days/week.
 */
export function statutoryEntitlementDays(workingDaysPerWeek: number, fte = 1): number {
  const raw = Math.min(workingDaysPerWeek * STATUTORY_WEEKS, STATUTORY_DAY_CAP);
  return round2(raw * clamp(fte, 0, 1));
}

/**
 * Pro-rates a full-year entitlement for someone who starts (or leaves)
 * partway through the leave year. Uses day-count between the effective
 * start within the year and the year end.
 */
export function proRataEntitlement(
  fullYearDays: number,
  leaveYearStart: Date,
  leaveYearEnd: Date,
  employmentStart: Date,
  employmentEnd?: Date | null,
): number {
  const yearStart = max(leaveYearStart, employmentStart);
  const yearEnd = employmentEnd ? min(leaveYearEnd, employmentEnd) : leaveYearEnd;
  if (yearEnd < yearStart) return 0;

  const totalDays = daysBetweenInclusive(leaveYearStart, leaveYearEnd);
  const workedDays = daysBetweenInclusive(yearStart, yearEnd);
  return round2((fullYearDays * workedDays) / totalDays);
}

/** The leave year containing `on`, given a company year-start month/day. */
export function leaveYearBounds(
  on: Date,
  startMonth: number,
  startDay: number,
): { start: Date; end: Date; year: number } {
  const y = on.getUTCFullYear();
  const thisYearStart = Date.UTC(y, startMonth - 1, startDay);
  const startYear = on.getTime() >= thisYearStart ? y : y - 1;
  const start = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const end = new Date(Date.UTC(startYear + 1, startMonth - 1, startDay - 1));
  return { start, end, year: startYear };
}

/**
 * Counts working days between two dates inclusive, excluding weekends and any
 * supplied bank/public holidays. `dayParts` lets the first/last day be a half.
 */
export function countWorkingDays(
  start: Date,
  end: Date,
  opts: { holidays?: Date[]; startPart?: "full" | "am" | "pm"; endPart?: "full" | "am" | "pm" } = {},
): number {
  if (end < start) return 0;
  const holidaySet = new Set((opts.holidays ?? []).map(toYmd));
  let days = 0;
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());

  while (cursor.getTime() <= last) {
    const dow = cursor.getUTCDay();
    const isWeekend = dow === 0 || dow === 6;
    if (!isWeekend && !holidaySet.has(toYmd(cursor))) days += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Apply half-day adjustments only when the boundary day is itself a working day.
  const single = toYmd(start) === toYmd(end);
  if (single) {
    if ((opts.startPart && opts.startPart !== "full") || (opts.endPart && opts.endPart !== "full")) {
      return days > 0 ? 0.5 : 0;
    }
    return days;
  }
  if (opts.startPart === "pm" && isWorkingDay(start, holidaySet)) days -= 0.5;
  if (opts.endPart === "am" && isWorkingDay(end, holidaySet)) days -= 0.5;
  return round2(days);
}

export interface LeaveBalance {
  entitlement: number; // incl. carry-over
  taken: number;       // approved + taken
  booked: number;      // pending
  remaining: number;   // entitlement - taken - booked
}

export function computeBalance(entitlement: number, carriedOver: number, taken: number, pending: number): LeaveBalance {
  const total = round2(entitlement + carriedOver);
  return {
    entitlement: total,
    taken: round2(taken),
    booked: round2(pending),
    remaining: round2(total - taken - pending),
  };
}

// ── helpers ───────────────────────────────────────────────
function isWorkingDay(d: Date, holidays: Set<string>) {
  const dow = d.getUTCDay();
  return dow !== 0 && dow !== 6 && !holidays.has(toYmd(d));
}
function toYmd(d: Date) {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}
function daysBetweenInclusive(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function max(a: Date, b: Date) {
  return a > b ? a : b;
}
function min(a: Date, b: Date) {
  return a < b ? a : b;
}
