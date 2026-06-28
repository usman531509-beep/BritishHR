import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export type PlanFeatures = string[];

export function planFeatures(features: unknown): PlanFeatures {
  return Array.isArray(features) ? (features.filter((f) => typeof f === "string") as string[]) : [];
}

/**
 * Active plans for the public pricing section, in display order.
 * Cached so the public landing page doesn't hit the DB on every request
 * (revalidated every 5 min, or immediately when the owner edits plans via the
 * "plans" tag — see plan-actions.ts).
 */
export const listPublicPlans = unstable_cache(
  async () => prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ["public-plans"],
  { revalidate: 300, tags: ["plans"] },
);

/** All plans (incl. hidden) for the Platform Owner manager. */
export async function listAllPlans() {
  return prisma.plan.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { sortOrder: "asc" },
  });
}
