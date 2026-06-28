import { prisma } from "@/lib/db/prisma";
import { BOARD_COLUMNS } from "@/lib/domain/recruitment";

export async function reportingData(tenantId: string) {
  const [
    headcountByDept,
    statusGroups,
    leaveByType,
    latestRun,
    applications,
    headTotal,
  ] = await Promise.all([
    prisma.employee.groupBy({ by: ["departmentId"], where: { tenantId, deletedAt: null }, _count: { _all: true } }),
    prisma.employee.groupBy({ by: ["status"], where: { tenantId, deletedAt: null }, _count: { _all: true } }),
    prisma.leaveRequest.groupBy({ by: ["leaveTypeId"], where: { tenantId, status: { in: ["approved", "taken"] } }, _sum: { days: true } }),
    prisma.payRun.findFirst({ where: { tenantId, status: "finalised" }, orderBy: { payDate: "desc" }, include: { payslips: true } }),
    prisma.application.groupBy({ by: ["stage"], where: { tenantId }, _count: { _all: true } }),
    prisma.employee.count({ where: { tenantId, deletedAt: null } }),
  ]);

  // Resolve department & leave-type names.
  const [depts, leaveTypes] = await Promise.all([
    prisma.department.findMany({ where: { tenantId }, select: { id: true, name: true } }),
    prisma.leaveType.findMany({ where: { tenantId }, select: { id: true, name: true } }),
  ]);
  const deptName = new Map(depts.map((d) => [d.id, d.name]));
  const ltName = new Map(leaveTypes.map((l) => [l.id, l.name]));

  const headcount = headcountByDept.map((g) => ({ label: g.departmentId ? deptName.get(g.departmentId) ?? "—" : "Unassigned", value: g._count._all }));
  const byStatus = statusGroups.map((g) => ({ label: g.status.replace(/_/g, " "), value: g._count._all }));
  const leave = leaveByType.map((g) => ({ label: ltName.get(g.leaveTypeId) ?? "—", value: Math.round((g._sum.days ?? 0) * 10) / 10 }));

  const payrollCost = latestRun
    ? {
        period: latestRun.periodLabel,
        gross: latestRun.payslips.reduce((s, p) => s + p.grossPence, 0),
        employerNi: latestRun.payslips.reduce((s, p) => s + p.employerNiPence, 0),
        employerPension: latestRun.payslips.reduce((s, p) => s + p.pensionEmployerPence, 0),
      }
    : null;

  const stageCounts = new Map(applications.map((a) => [a.stage, a._count._all]));
  const funnel = BOARD_COLUMNS.map((stage) => ({ label: stage, value: stageCounts.get(stage) ?? 0 }));

  return { headcount, byStatus, leave, payrollCost, funnel, headTotal };
}
