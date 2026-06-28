import { prisma } from "@/lib/db/prisma";
import { leaveYearBounds, computeBalance } from "@/lib/domain/leave";
import { PENDING_STATUSES, CONSUMED_STATUSES } from "@/lib/domain/leave-state";

/** Resolve the active leave year for a tenant on a given date. */
export async function activeLeaveYear(tenantId: string, on = new Date()) {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { leaveYearStartMonth: true, leaveYearStartDay: true },
  });
  return leaveYearBounds(on, tenant.leaveYearStartMonth, tenant.leaveYearStartDay);
}

/**
 * Per-leave-type balance for an employee in the active leave year.
 * Only balance-affecting types (annual, TOIL) are included.
 */
export async function employeeLeaveBalances(tenantId: string, employeeId: string) {
  const { year } = await activeLeaveYear(tenantId);

  const entitlements = await prisma.leaveEntitlement.findMany({
    where: { tenantId, employeeId, year },
    include: { leaveType: true },
  });

  const balances = await Promise.all(
    entitlements
      .filter((e) => e.leaveType.affectsBalance)
      .map(async (e) => {
        const [consumed, pending] = await Promise.all([
          prisma.leaveRequest.aggregate({
            where: { tenantId, employeeId, leaveTypeId: e.leaveTypeId, status: { in: CONSUMED_STATUSES } },
            _sum: { days: true },
          }),
          prisma.leaveRequest.aggregate({
            where: { tenantId, employeeId, leaveTypeId: e.leaveTypeId, status: { in: PENDING_STATUSES } },
            _sum: { days: true },
          }),
        ]);
        return {
          leaveType: e.leaveType,
          year,
          ...computeBalance(
            e.entitlementDays,
            e.carriedOverDays,
            consumed._sum.days ?? 0,
            pending._sum.days ?? 0,
          ),
        };
      }),
  );

  return balances;
}

export async function listLeaveTypes(tenantId: string) {
  return prisma.leaveType.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function listEmployeeRequests(tenantId: string, employeeId: string) {
  return prisma.leaveRequest.findMany({
    where: { tenantId, employeeId },
    include: { leaveType: true, approver: { select: { firstName: true, lastName: true } } },
    orderBy: { startDate: "desc" },
  });
}

/** Pending requests an approver can act on (their direct reports), or all for HR. */
export async function pendingApprovals(tenantId: string, approverEmployeeId: string | null, seeAll: boolean) {
  return prisma.leaveRequest.findMany({
    where: {
      tenantId,
      status: "pending",
      ...(seeAll ? {} : { employee: { managerId: approverEmployeeId ?? "__none__" } }),
    },
    include: {
      leaveType: true,
      employee: { select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } } },
    },
    orderBy: { startDate: "asc" },
  });
}

export async function listAllRequests(tenantId: string, status?: string) {
  return prisma.leaveRequest.findMany({
    where: { tenantId, ...(status ? { status: status as never } : {}) },
    include: {
      leaveType: true,
      employee: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** Approved/pending leave overlapping a date window — for the calendar. */
export async function leaveInRange(tenantId: string, from: Date, to: Date) {
  return prisma.leaveRequest.findMany({
    where: {
      tenantId,
      status: { in: ["approved", "pending", "taken"] },
      startDate: { lte: to },
      endDate: { gte: from },
    },
    include: {
      leaveType: { select: { name: true, colour: true } },
      employee: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function absenceWithBradford(tenantId: string, employeeId: string) {
  return prisma.absenceRecord.findMany({
    where: { tenantId, employeeId },
    orderBy: { startDate: "desc" },
  });
}

/** All employees with absence in the last year, for the Bradford Factor table. */
export async function tenantAbsenceSummary(tenantId: string) {
  const employees = await prisma.employee.findMany({
    where: { tenantId, deletedAt: null, absences: { some: {} } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      absences: { select: { startDate: true, endDate: true, workingDays: true } },
    },
  });
  return employees;
}
