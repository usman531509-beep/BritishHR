"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { platformAction } from "@/lib/actions/guard";
import { poundsToPence } from "@/lib/validation/uk";
import { planSchema, planIdSchema } from "@/lib/validation/plans";

function toFeatureArray(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export const savePlan = platformAction(
  { schema: planSchema, audit: { action: "plan.save", entity: "Plan" } },
  async (_ctx, input) => {
    const data = {
      name: input.name,
      description: input.description || null,
      monthlyPence: poundsToPence(input.price),
      maxEmployees: input.maxEmployees,
      features: toFeatureArray(input.features),
      ctaText: input.ctaText || "Start free trial",
      isPopular: input.isPopular,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    };

    let id = input.id;
    if (id) {
      const existing = await prisma.plan.findUnique({ where: { id }, select: { id: true } });
      if (!existing) throw new Error("Plan not found");
      await prisma.plan.update({ where: { id }, data });
    } else {
      const clash = await prisma.plan.findUnique({ where: { name: input.name }, select: { id: true } });
      if (clash) throw new Error("A plan with that name already exists");
      const created = await prisma.plan.create({ data, select: { id: true } });
      id = created.id;
    }

    revalidateTag("plans", "max"); // refresh the cached public pricing
    revalidatePath("/owner/plans");
    revalidatePath("/"); // public pricing reflects changes immediately
    return { id };
  },
);

export const deletePlan = platformAction(
  { schema: planIdSchema, audit: { action: "plan.delete", entity: "Plan" } },
  async (_ctx, input) => {
    const plan = await prisma.plan.findUnique({
      where: { id: input.id },
      select: { id: true, _count: { select: { subscriptions: true } } },
    });
    if (!plan) throw new Error("Plan not found");
    if (plan._count.subscriptions > 0) {
      throw new Error("This plan has active subscriptions — hide it instead of deleting.");
    }
    await prisma.plan.delete({ where: { id: input.id } });
    revalidateTag("plans", "max"); // refresh the cached public pricing
    revalidatePath("/owner/plans");
    revalidatePath("/");
    return { id: input.id };
  },
);
