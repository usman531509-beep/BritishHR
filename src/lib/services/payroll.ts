import { prisma } from "@/lib/db/prisma";
import { assessAutoEnrolment } from "@/lib/domain/payroll";

export async function listPayRuns(tenantId: string) {
  const runs = await prisma.payRun.findMany({
    where: { tenantId },
    include: { _count: { select: { payslips: true } }, payslips: { select: { grossPence: true, netPence: true, employerNiPence: true, pensionEmployerPence: true } } },
    orderBy: { payDate: "desc" },
  });
  return runs.map((r) => {
    const gross = r.payslips.reduce((s, p) => s + p.grossPence, 0);
    const net = r.payslips.reduce((s, p) => s + p.netPence, 0);
    const employerCost = r.payslips.reduce((s, p) => s + p.grossPence + p.employerNiPence + p.pensionEmployerPence, 0);
    return { id: r.id, periodLabel: r.periodLabel, payDate: r.payDate, status: r.status, frequency: r.frequency, taxYear: r.taxYear, headcount: r._count.payslips, gross, net, employerCost };
  });
}

export async function getPayRun(tenantId: string, id: string) {
  return prisma.payRun.findFirst({
    where: { id, tenantId },
    include: {
      payslips: { include: { employee: { select: { firstName: true, lastName: true, payrollRef: true } } }, orderBy: { employee: { lastName: "asc" } } },
    },
  });
}

export async function employeePayslips(tenantId: string, employeeId: string) {
  return prisma.payslip.findMany({
    where: { tenantId, employeeId, payRun: { status: "finalised" } },
    include: { payRun: { select: { periodLabel: true, payDate: true } } },
    orderBy: { payRun: { payDate: "desc" } },
  });
}

export async function getPayslip(tenantId: string, id: string, employeeId?: string) {
  return prisma.payslip.findFirst({
    where: { id, tenantId, ...(employeeId ? { employeeId } : {}) },
    include: { payRun: { select: { periodLabel: true, payDate: true, status: true } }, employee: { select: { firstName: true, lastName: true, payrollRef: true } } },
  });
}

/** Auto-enrolment assessment per employee, joined with current enrolment. */
export async function pensionRoster(tenantId: string) {
  const [employees, scheme] = await Promise.all([
    prisma.employee.findMany({
      where: { tenantId, deletedAt: null, status: { in: ["active", "on_leave", "onboarding"] } },
      select: { id: true, firstName: true, lastName: true, dob: true, annualSalaryPence: true, pensionEnrolment: { select: { status: true } } },
      orderBy: { lastName: "asc" },
    }),
    prisma.pensionScheme.findFirst({ where: { tenantId, isDefault: true } }),
  ]);
  const now = new Date();
  const roster = employees.map((e) => {
    const age = e.dob ? Math.floor((now.getTime() - new Date(e.dob).getTime()) / (365.25 * 86_400_000)) : 30;
    const category = assessAutoEnrolment(age, e.annualSalaryPence ?? 0);
    return {
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      category,
      status: e.pensionEnrolment?.status ?? "not_eligible",
    };
  });
  return { roster, scheme };
}

// ── Expenses ──
export async function listExpenses(tenantId: string, opts: { employeeId?: string; managerId?: string; seeAll?: boolean } = {}) {
  return prisma.expenseClaim.findMany({
    where: {
      tenantId,
      ...(opts.employeeId ? { employeeId: opts.employeeId } : {}),
      ...(opts.managerId && !opts.seeAll ? { employee: { managerId: opts.managerId } } : {}),
    },
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function pendingExpenses(tenantId: string, managerEmployeeId: string | null, seeAll: boolean) {
  return prisma.expenseClaim.findMany({
    where: { tenantId, status: "pending", ...(seeAll ? {} : { employee: { managerId: managerEmployeeId ?? "__none__" } }) },
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "asc" },
  });
}

// ── Benefits / P11D ──
export async function benefitsSummary(tenantId: string) {
  const benefits = await prisma.benefitInKind.findMany({
    where: { tenantId },
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });
  const totalClass1A = Math.round(benefits.reduce((s, b) => s + b.cashEquivalentPence, 0) * 0.138); // employer Class 1A NIC
  return { benefits, totalClass1A };
}
