"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { guardedAction } from "@/lib/actions/guard";
import { encryptField } from "@/lib/crypto";
import { poundsToPence } from "@/lib/validation/uk";
import { createEmployeeSchema, updateEmployeeSchema } from "@/lib/validation/employee";
import { z } from "zod";
const zDeleteEmployee = z.object({ id: z.string().min(1) });

export const createEmployee = guardedAction(
  { require: { module: "employee", action: "create" }, schema: createEmployeeSchema, audit: { action: "employee.create", entity: "Employee" } },
  async (ctx, input) => {
    const employee = await prisma.employee.create({
      data: {
        tenantId: ctx.tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email || null,
        phone: input.phone || null,
        payrollRef: input.payrollRef || null,
        niNumberEnc: input.niNumber ? encryptField(input.niNumber) : null,
        dob: input.dob ?? null,
        startDate: input.startDate,
        status: input.status,
        fte: input.fte,
        annualSalaryPence: input.annualSalary != null ? poundsToPence(input.annualSalary) : null,
        rightToWorkStatus: input.rightToWorkStatus,
        rightToWorkExpiry: input.rightToWorkExpiry ?? null,
        departmentId: input.departmentId || null,
        teamId: input.teamId || null,
        jobTitleId: input.jobTitleId || null,
        siteId: input.siteId || null,
        managerId: input.managerId || null,
        contracts: {
          create: {
            tenantId: ctx.tenantId,
            type: input.contractType,
            startDate: input.startDate,
            annualSalaryPence: input.annualSalary != null ? poundsToPence(input.annualSalary) : null,
            isCurrent: true,
          },
        },
      },
      select: { id: true },
    });
    revalidatePath("/admin/employees");
    return employee;
  },
);

export const updateEmployee = guardedAction(
  { require: { module: "employee", action: "edit" }, schema: updateEmployeeSchema, audit: { action: "employee.update", entity: "Employee" } },
  async (ctx, input) => {
    // Ensure the record belongs to this tenant before mutating.
    const existing = await prisma.employee.findFirst({
      where: { id: input.id, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!existing) throw new Error("Employee not found");

    const updated = await prisma.employee.update({
      where: { id: input.id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email || null,
        phone: input.phone || null,
        payrollRef: input.payrollRef || null,
        ...(input.niNumber ? { niNumberEnc: encryptField(input.niNumber) } : {}),
        dob: input.dob ?? undefined,
        startDate: input.startDate ?? undefined,
        status: input.status,
        fte: input.fte,
        ...(input.annualSalary != null ? { annualSalaryPence: poundsToPence(input.annualSalary) } : {}),
        rightToWorkStatus: input.rightToWorkStatus,
        rightToWorkExpiry: input.rightToWorkExpiry ?? undefined,
        departmentId: input.departmentId || null,
        teamId: input.teamId || null,
        jobTitleId: input.jobTitleId || null,
        siteId: input.siteId || null,
        managerId: input.managerId || null,
      },
      select: { id: true },
    });
    revalidatePath("/admin/employees");
    revalidatePath(`/admin/employees/${input.id}`);
    return updated;
  },
);

export const deleteEmployee = guardedAction(
  { require: { module: "employee", action: "delete" }, schema: zDeleteEmployee, audit: { action: "employee.delete", entity: "Employee" } },
  async (ctx, input) => {
    const emp = await prisma.employee.findFirst({ where: { id: input.id, tenantId: ctx.tenantId }, select: { id: true } });
    if (!emp) throw new Error("Employee not found");
    // Soft delete — preserves payroll/leave history and the audit trail.
    await prisma.employee.update({ where: { id: emp.id }, data: { deletedAt: new Date(), status: "left" } });
    revalidatePath("/admin/employees");
    return { id: emp.id };
  },
);
