import { prisma } from "@/lib/db/prisma";

export async function listPlans() {
  return prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

export async function platformStats() {
  const [companies, activeSubs, tickets, subs] = await Promise.all([
    prisma.tenant.count(),
    prisma.subscription.count({ where: { status: { in: ["active", "trialing"] } } }),
    prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.subscription.findMany({ where: { status: "active" }, include: { plan: true } }),
  ]);
  const mrr = subs.reduce((s, sub) => s + sub.plan.monthlyPence, 0);
  return { companies, activeSubs, openTickets: tickets, mrr };
}

export async function listCompanies() {
  const tenants = await prisma.tenant.findMany({
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { employees: true, users: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return tenants;
}

export async function getCompany(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: {
      subscription: { include: { plan: true } },
      invoices: { orderBy: { issuedAt: "desc" } },
      supportTickets: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { employees: true, users: true } },
    },
  });
}

export async function listSubscriptions() {
  const subs = await prisma.subscription.findMany({
    include: {
      tenant: { select: { id: true, name: true } },
      plan: true,
      invoices: { where: { status: { in: ["due", "overdue"] } }, select: { amountPence: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return subs.map((s) => ({ ...s, outstanding: s.invoices.reduce((a, i) => a + i.amountPence, 0) }));
}

export async function listInvoices() {
  return prisma.invoice.findMany({
    include: { tenant: { select: { name: true } } },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });
}

export async function listTickets() {
  return prisma.supportTicket.findMany({
    include: { tenant: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}
