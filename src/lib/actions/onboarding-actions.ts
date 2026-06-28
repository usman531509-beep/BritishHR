"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { guardedAction } from "@/lib/actions/guard";
import { DEFAULT_ONBOARDING_TASKS, dueDateFor } from "@/lib/domain/onboarding";

export const startOnboarding = guardedAction(
  { require: { module: "onboarding", action: "create" }, schema: z.object({ employeeId: z.string().min(1) }), audit: { action: "onboarding.start", entity: "OnboardingChecklist" } },
  async (ctx, input) => {
    const emp = await prisma.employee.findFirst({
      where: { id: input.employeeId, tenantId: ctx.tenantId },
      select: { id: true, firstName: true, lastName: true, startDate: true },
    });
    if (!emp) throw new Error("Employee not found");

    const existing = await prisma.onboardingChecklist.findFirst({ where: { tenantId: ctx.tenantId, employeeId: emp.id } });
    if (existing) throw new Error("This employee already has an onboarding checklist");

    // Prefer a tenant default template; otherwise fall back to the built-in UK template.
    const template = await prisma.onboardingTemplate.findFirst({
      where: { tenantId: ctx.tenantId, isDefault: true },
      include: { tasks: { orderBy: { sortOrder: "asc" } } },
    });
    const taskDefs = template
      ? template.tasks.map((t) => ({ title: t.title, category: t.category, dueOffsetDays: t.dueOffsetDays, sortOrder: t.sortOrder }))
      : DEFAULT_ONBOARDING_TASKS.map((t, i) => ({ title: t.title, category: t.category, dueOffsetDays: t.dueOffsetDays, sortOrder: i }));

    const checklist = await prisma.onboardingChecklist.create({
      data: {
        tenantId: ctx.tenantId,
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName} — Onboarding`,
        tasks: {
          create: taskDefs.map((t) => ({
            tenantId: ctx.tenantId,
            title: t.title,
            category: t.category,
            sortOrder: t.sortOrder,
            dueDate: dueDateFor(emp.startDate, t.dueOffsetDays),
          })),
        },
      },
      select: { id: true },
    });
    revalidatePath("/admin/onboarding");
    return checklist;
  },
);

export const toggleOnboardingTask = guardedAction(
  { require: { module: "onboarding", action: "edit" }, schema: z.object({ taskId: z.string().min(1) }), audit: { action: "onboarding.toggleTask", entity: "OnboardingTask" } },
  async (ctx, input) => {
    const task = await prisma.onboardingTask.findFirst({ where: { id: input.taskId, tenantId: ctx.tenantId } });
    if (!task) throw new Error("Task not found");
    const done = task.status === "done";
    const updated = await prisma.onboardingTask.update({
      where: { id: task.id },
      data: { status: done ? "pending" : "done", completedAt: done ? null : new Date() },
      select: { id: true, checklistId: true },
    });
    revalidatePath("/admin/onboarding");
    revalidatePath(`/admin/onboarding/${updated.checklistId}`);
    revalidatePath("/me/onboarding");
    return updated;
  },
);
