import { prisma } from "@/lib/db/prisma";

export async function listAnnouncements(tenantId: string) {
  const [announcements, audience] = await Promise.all([
    prisma.announcement.findMany({
      where: { tenantId },
      include: { _count: { select: { receipts: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employee.count({ where: { tenantId, deletedAt: null } }),
  ]);
  return announcements.map((a) => ({ ...a, reads: a._count.receipts, audienceSize: audience }));
}

/** Announcements visible to an employee, with whether they've acknowledged. */
export async function announcementsForEmployee(tenantId: string, employeeId: string, departmentId: string | null) {
  const announcements = await prisma.announcement.findMany({
    where: {
      tenantId,
      OR: [{ audience: "all" }, { audience: "department", departmentId: departmentId ?? "__none__" }],
    },
    include: { receipts: { where: { employeeId }, select: { id: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    mandatory: a.mandatory,
    createdAt: a.createdAt,
    acknowledged: a.receipts.length > 0,
  }));
}
