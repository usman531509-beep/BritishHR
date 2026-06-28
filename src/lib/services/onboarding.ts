import { prisma } from "@/lib/db/prisma";
import { checklistProgress } from "@/lib/domain/onboarding";

export async function listChecklists(tenantId: string) {
  const checklists = await prisma.onboardingChecklist.findMany({
    where: { tenantId },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, startDate: true } },
      tasks: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return checklists.map((c) => ({ ...c, progress: checklistProgress(c.tasks) }));
}

export async function getChecklist(tenantId: string, id: string) {
  return prisma.onboardingChecklist.findFirst({
    where: { id, tenantId },
    include: {
      employee: { select: { firstName: true, lastName: true } },
      tasks: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function myChecklist(tenantId: string, employeeId: string) {
  const c = await prisma.onboardingChecklist.findFirst({
    where: { tenantId, employeeId },
    include: { tasks: { orderBy: { sortOrder: "asc" } } },
  });
  return c ? { ...c, progress: checklistProgress(c.tasks) } : null;
}

/** Employees who don't yet have an onboarding checklist (for the start dropdown). */
export async function employeesWithoutChecklist(tenantId: string) {
  return prisma.employee.findMany({
    where: { tenantId, deletedAt: null, onboardingChecklists: { none: {} } },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { lastName: "asc" },
  });
}
