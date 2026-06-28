import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

const listSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  payrollRef: true,
  status: true,
  annualSalaryPence: true,
  rightToWorkStatus: true,
  startDate: true,
  department: { select: { id: true, name: true } },
  jobTitle: { select: { id: true, title: true } },
  manager: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.EmployeeSelect;

export async function listEmployees(
  tenantId: string,
  opts: { q?: string; departmentId?: string; status?: string } = {},
) {
  const where: Prisma.EmployeeWhereInput = {
    tenantId,
    deletedAt: null,
    ...(opts.departmentId ? { departmentId: opts.departmentId } : {}),
    ...(opts.status ? { status: opts.status as never } : {}),
    ...(opts.q
      ? {
          OR: [
            { firstName: { contains: opts.q, mode: "insensitive" } },
            { lastName: { contains: opts.q, mode: "insensitive" } },
            { email: { contains: opts.q, mode: "insensitive" } },
            { payrollRef: { contains: opts.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.employee.findMany({
    where,
    select: listSelect,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getEmployee(tenantId: string, id: string) {
  return prisma.employee.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      department: true,
      team: true,
      jobTitle: true,
      site: true,
      manager: { select: { id: true, firstName: true, lastName: true } },
      reports: { select: { id: true, firstName: true, lastName: true, status: true } },
      contracts: { orderBy: { startDate: "desc" } },
      history: { orderBy: { effectiveDate: "desc" } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getEmployeeByUser(tenantId: string, userId: string) {
  return prisma.employee.findFirst({
    where: { tenantId, userId, deletedAt: null },
    include: {
      department: true,
      jobTitle: true,
      manager: { select: { id: true, firstName: true, lastName: true } },
      contracts: { where: { isCurrent: true }, take: 1 },
    },
  });
}

/** Options for select inputs (departments, titles, sites, potential managers). */
export async function getOrgOptions(tenantId: string) {
  const [departments, jobTitles, sites, managers] = await Promise.all([
    prisma.department.findMany({ where: { tenantId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.jobTitle.findMany({ where: { tenantId }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.site.findMany({ where: { tenantId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.employee.findMany({
      where: { tenantId, deletedAt: null, status: { in: ["active", "on_leave"] } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ]);
  return { departments, jobTitles, sites, managers };
}

export async function employeeStats(tenantId: string) {
  const [total, active, onboarding, rtwIssues] = await Promise.all([
    prisma.employee.count({ where: { tenantId, deletedAt: null } }),
    prisma.employee.count({ where: { tenantId, deletedAt: null, status: "active" } }),
    prisma.employee.count({ where: { tenantId, deletedAt: null, status: "onboarding" } }),
    prisma.employee.count({
      where: { tenantId, deletedAt: null, rightToWorkStatus: { in: ["pending", "expired", "follow_up_due"] } },
    }),
  ]);
  return { total, active, onboarding, rtwIssues };
}
