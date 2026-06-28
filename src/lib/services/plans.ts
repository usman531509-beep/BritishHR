import { prisma } from "@/lib/db/prisma";

export type PlanFeatures = string[];

export function planFeatures(features: unknown): PlanFeatures {
  return Array.isArray(features) ? (features.filter((f) => typeof f === "string") as string[]) : [];
}

/** Active plans for the public pricing section, in display order. */
export async function listPublicPlans() {
  return prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

/** All plans (incl. hidden) for the Platform Owner manager. */
export async function listAllPlans() {
  return prisma.plan.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { sortOrder: "asc" },
  });
}
