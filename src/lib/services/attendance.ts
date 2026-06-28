import { prisma } from "@/lib/db/prisma";
import { workedHours, totalHours, weeklyCompliance } from "@/lib/domain/attendance";

/** Monday 00:00 UTC of the week containing `d`. */
export function weekStart(d = new Date()): Date {
  const base = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const offset = (base.getUTCDay() + 6) % 7;
  base.setUTCDate(base.getUTCDate() - offset);
  return base;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export async function openEntry(tenantId: string, employeeId: string) {
  return prisma.timeEntry.findFirst({
    where: { tenantId, employeeId, status: "open" },
    orderBy: { clockIn: "desc" },
  });
}

export async function myTimeEntries(tenantId: string, employeeId: string, limit = 30) {
  const entries = await prisma.timeEntry.findMany({
    where: { tenantId, employeeId },
    orderBy: { clockIn: "desc" },
    take: limit,
  });
  return entries.map((e) => ({ ...e, hours: workedHours(e.clockIn, e.clockOut, e.breakMinutes) }));
}

/** Total worked hours for the current week (Mon–Sun). */
export async function myWeekHours(tenantId: string, employeeId: string): Promise<number> {
  const from = weekStart();
  const to = addDays(from, 7);
  const entries = await prisma.timeEntry.findMany({
    where: { tenantId, employeeId, date: { gte: from, lt: to } },
  });
  return Math.round(totalHours(entries.map((e) => ({ clockIn: e.clockIn, clockOut: e.clockOut, breakMinutes: e.breakMinutes }))) * 10) / 10;
}

/** Entries for a manager's reports (or all, for HR) within the current week. */
export async function teamTimeEntries(tenantId: string, managerEmployeeId: string | null, seeAll: boolean) {
  const from = weekStart();
  const entries = await prisma.timeEntry.findMany({
    where: {
      tenantId,
      date: { gte: from },
      ...(seeAll ? {} : { employee: { managerId: managerEmployeeId ?? "__none__" } }),
    },
    include: { employee: { select: { id: true, firstName: true, lastName: true, managerId: true } } },
    orderBy: { clockIn: "desc" },
  });
  return entries.map((e) => ({ ...e, hours: workedHours(e.clockIn, e.clockOut, e.breakMinutes) }));
}

/** Per-employee WTD weekly hours snapshot + breach flag (current week). */
export async function wtdWeekSnapshot(tenantId: string) {
  const from = weekStart();
  const to = addDays(from, 7);
  const entries = await prisma.timeEntry.findMany({
    where: { tenantId, date: { gte: from, lt: to }, clockOut: { not: null } },
    include: { employee: { select: { id: true, firstName: true, lastName: true } } },
  });
  const byEmp = new Map<string, { name: string; periods: { clockIn: Date; clockOut: Date | null; breakMinutes: number }[] }>();
  for (const e of entries) {
    const k = e.employeeId;
    if (!byEmp.has(k)) byEmp.set(k, { name: `${e.employee.firstName} ${e.employee.lastName}`, periods: [] });
    byEmp.get(k)!.periods.push({ clockIn: e.clockIn, clockOut: e.clockOut, breakMinutes: e.breakMinutes });
  }
  return Array.from(byEmp.entries())
    .map(([id, v]) => ({ id, name: v.name, ...weeklyCompliance(v.periods) }))
    .sort((a, b) => b.hours - a.hours);
}

export async function pendingTimeEntryCount(tenantId: string) {
  return prisma.timeEntry.count({ where: { tenantId, status: "submitted" } });
}

/** Shifts for a week window, grouped for the rota grid. */
export async function weekShifts(tenantId: string, from: Date, to: Date) {
  return prisma.shift.findMany({
    where: { tenantId, date: { gte: from, lt: to } },
    include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export { totalHours };
