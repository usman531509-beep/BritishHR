import { prisma } from "@/lib/db/prisma";

export async function listVacancies(tenantId: string) {
  const vacancies = await prisma.vacancy.findMany({
    where: { tenantId },
    include: {
      _count: { select: { applications: true } },
      applications: { select: { stage: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return vacancies.map((v) => ({
    ...v,
    hired: v.applications.filter((a) => a.stage === "hired").length,
    active: v.applications.filter((a) => !["hired", "rejected", "withdrawn"].includes(a.stage)).length,
  }));
}

export async function getVacancy(tenantId: string, id: string) {
  return prisma.vacancy.findFirst({
    where: { id, tenantId },
    include: {
      applications: {
        include: { candidate: true, offer: true, interviews: true },
        orderBy: { appliedAt: "asc" },
      },
    },
  });
}

export async function recruitmentStats(tenantId: string) {
  const [openVacancies, activeApps, offers] = await Promise.all([
    prisma.vacancy.count({ where: { tenantId, status: "open" } }),
    prisma.application.count({ where: { tenantId, stage: { notIn: ["hired", "rejected", "withdrawn"] } } }),
    prisma.application.count({ where: { tenantId, stage: "offer" } }),
  ]);
  return { openVacancies, activeApps, offers };
}
