"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { guardedAction } from "@/lib/actions/guard";
import { clockOutSchema, approveTimeEntrySchema, createShiftSchema } from "@/lib/validation/attendance";
import { z } from "zod";

function todayUtc(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

export const clockIn = guardedAction(
  { require: { module: "attendance", action: "create" }, schema: z.object({}), audit: { action: "attendance.clockIn", entity: "TimeEntry" } },
  async (ctx) => {
    if (!ctx.employeeId) throw new Error("No employee record linked to your account");
    const existing = await prisma.timeEntry.findFirst({
      where: { tenantId: ctx.tenantId, employeeId: ctx.employeeId, status: "open" },
    });
    if (existing) throw new Error("You are already clocked in");

    const entry = await prisma.timeEntry.create({
      data: {
        tenantId: ctx.tenantId,
        employeeId: ctx.employeeId,
        date: todayUtc(),
        clockIn: new Date(),
        status: "open",
      },
      select: { id: true },
    });
    revalidatePath("/me/timesheet");
    return entry;
  },
);

export const clockOut = guardedAction(
  { require: { module: "attendance", action: "create" }, schema: clockOutSchema, audit: { action: "attendance.clockOut", entity: "TimeEntry" } },
  async (ctx, input) => {
    if (!ctx.employeeId) throw new Error("No employee record linked to your account");
    const open = await prisma.timeEntry.findFirst({
      where: { tenantId: ctx.tenantId, employeeId: ctx.employeeId, status: "open" },
      orderBy: { clockIn: "desc" },
    });
    if (!open) throw new Error("You are not clocked in");

    const updated = await prisma.timeEntry.update({
      where: { id: open.id },
      data: { clockOut: new Date(), breakMinutes: input.breakMinutes, status: "submitted" },
      select: { id: true },
    });
    revalidatePath("/me/timesheet");
    revalidatePath("/manager/attendance");
    return updated;
  },
);

export const approveTimeEntry = guardedAction(
  { require: { module: "attendance", action: "approve" }, schema: approveTimeEntrySchema, audit: { action: "attendance.approve", entity: "TimeEntry" } },
  async (ctx, input) => {
    const entry = await prisma.timeEntry.findFirst({
      where: { id: input.id, tenantId: ctx.tenantId },
      include: { employee: { select: { managerId: true } } },
    });
    if (!entry) throw new Error("Time entry not found");
    const isHr = ctx.ability.can("attendance", "edit");
    if (!isHr && entry.employee.managerId !== ctx.employeeId) {
      throw new Error("You can only approve entries for your direct reports");
    }
    const updated = await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { status: input.decision === "approve" ? "approved" : "rejected", approverId: ctx.employeeId },
      select: { id: true },
    });
    revalidatePath("/manager/attendance");
    revalidatePath("/admin/attendance");
    return updated;
  },
);

export const createShift = guardedAction(
  { require: { module: "attendance", action: "edit" }, schema: createShiftSchema, audit: { action: "rota.createShift", entity: "Shift" } },
  async (ctx, input) => {
    // Ensure the employee belongs to this tenant.
    const emp = await prisma.employee.findFirst({ where: { id: input.employeeId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!emp) throw new Error("Employee not found");

    const shift = await prisma.shift.create({
      data: {
        tenantId: ctx.tenantId,
        employeeId: input.employeeId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        breakMinutes: input.breakMinutes,
        note: input.note || null,
      },
      select: { id: true },
    });
    revalidatePath("/manager/rota");
    return shift;
  },
);
