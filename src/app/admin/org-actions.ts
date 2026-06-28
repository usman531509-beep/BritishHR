"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { guardedAction } from "@/lib/actions/guard";

export const createDepartment = guardedAction(
  {
    require: { module: "department", action: "create" },
    schema: z.object({ name: z.string().trim().min(1, "Name is required").max(80) }),
    audit: { action: "department.create", entity: "Department" },
  },
  async (ctx, input) => {
    const dept = await prisma.department.create({
      data: { tenantId: ctx.tenantId, name: input.name },
      select: { id: true },
    });
    revalidatePath("/admin/departments");
    revalidatePath("/admin/org");
    return dept;
  },
);

export const createJobTitle = guardedAction(
  {
    require: { module: "jobtitle", action: "create" },
    schema: z.object({ title: z.string().trim().min(1, "Title is required").max(80) }),
    audit: { action: "jobtitle.create", entity: "JobTitle" },
  },
  async (ctx, input) => {
    const jt = await prisma.jobTitle.create({
      data: { tenantId: ctx.tenantId, title: input.title },
      select: { id: true },
    });
    revalidatePath("/admin/job-titles");
    return jt;
  },
);

export const deleteDepartment = guardedAction(
  {
    require: { module: "department", action: "delete" },
    schema: z.object({ id: z.string().min(1) }),
    audit: { action: "department.delete", entity: "Department" },
  },
  async (ctx, input) => {
    const dept = await prisma.department.findFirst({
      where: { id: input.id, tenantId: ctx.tenantId },
      select: { id: true, _count: { select: { employees: true } } },
    });
    if (!dept) throw new Error("Department not found");
    if (dept._count.employees > 0) {
      throw new Error("Reassign or remove employees before deleting this department");
    }
    await prisma.department.delete({ where: { id: dept.id } });
    revalidatePath("/admin/departments");
    revalidatePath("/admin/org");
    return { id: dept.id };
  },
);

export const deleteJobTitle = guardedAction(
  {
    require: { module: "jobtitle", action: "delete" },
    schema: z.object({ id: z.string().min(1) }),
    audit: { action: "jobtitle.delete", entity: "JobTitle" },
  },
  async (ctx, input) => {
    const jt = await prisma.jobTitle.findFirst({
      where: { id: input.id, tenantId: ctx.tenantId },
      select: { id: true, _count: { select: { employees: true } } },
    });
    if (!jt) throw new Error("Job title not found");
    if (jt._count.employees > 0) {
      throw new Error("Reassign employees before deleting this job title");
    }
    await prisma.jobTitle.delete({ where: { id: jt.id } });
    revalidatePath("/admin/job-titles");
    return { id: jt.id };
  },
);
