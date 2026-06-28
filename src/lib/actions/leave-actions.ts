"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { guardedAction } from "@/lib/actions/guard";
import { countWorkingDays, computeBalance } from "@/lib/domain/leave";
import { nextStatus, canTransition } from "@/lib/domain/leave-state";
import { activeLeaveYear } from "@/lib/services/leave";
import { CONSUMED_STATUSES, PENDING_STATUSES } from "@/lib/domain/leave-state";
import { requestLeaveSchema, decideLeaveSchema, cancelLeaveSchema } from "@/lib/validation/leave";

export const requestLeave = guardedAction(
  { require: { module: "leave", action: "create" }, schema: requestLeaveSchema, audit: { action: "leave.request", entity: "LeaveRequest" } },
  async (ctx, input) => {
    // Resolve the target employee: self by default; HR may book on behalf.
    const targetId =
      input.employeeId && ctx.ability.can("leave", "edit") ? input.employeeId : ctx.employeeId;
    if (!targetId) throw new Error("No employee record is linked to your account");

    const leaveType = await prisma.leaveType.findFirst({
      where: { id: input.leaveTypeId, tenantId: ctx.tenantId, isActive: true },
    });
    if (!leaveType) throw new Error("Invalid leave type");

    const days = countWorkingDays(input.startDate, input.endDate, {
      startPart: input.startPart,
      endPart: input.endPart,
    });
    if (days <= 0) throw new Error("The selected dates contain no working days");

    // Enforce balance for balance-affecting types.
    if (leaveType.affectsBalance) {
      const { year } = await activeLeaveYear(ctx.tenantId);
      const entitlement = await prisma.leaveEntitlement.findUnique({
        where: { employeeId_leaveTypeId_year: { employeeId: targetId, leaveTypeId: leaveType.id, year } },
      });
      const [consumed, pending] = await Promise.all([
        prisma.leaveRequest.aggregate({ where: { tenantId: ctx.tenantId, employeeId: targetId, leaveTypeId: leaveType.id, status: { in: CONSUMED_STATUSES } }, _sum: { days: true } }),
        prisma.leaveRequest.aggregate({ where: { tenantId: ctx.tenantId, employeeId: targetId, leaveTypeId: leaveType.id, status: { in: PENDING_STATUSES } }, _sum: { days: true } }),
      ]);
      const bal = computeBalance(entitlement?.entitlementDays ?? 0, entitlement?.carriedOverDays ?? 0, consumed._sum.days ?? 0, pending._sum.days ?? 0);
      if (days > bal.remaining) {
        throw new Error(`Insufficient balance: ${bal.remaining} day(s) remaining, ${days} requested`);
      }
    }

    const created = await prisma.leaveRequest.create({
      data: {
        tenantId: ctx.tenantId,
        employeeId: targetId,
        leaveTypeId: leaveType.id,
        startDate: input.startDate,
        endDate: input.endDate,
        startPart: input.startPart,
        endPart: input.endPart,
        days,
        reason: input.reason || null,
        status: leaveType.requiresApproval ? "pending" : "approved",
      },
      select: { id: true },
    });

    await prisma.activityEvent.create({
      data: { tenantId: ctx.tenantId, actorId: ctx.userId, type: "leave.requested", summary: `${days} day(s) ${leaveType.name} requested` },
    });

    revalidatePath("/me/leave");
    revalidatePath("/manager/approvals");
    revalidatePath("/admin/leave");
    return created;
  },
);

export const decideLeave = guardedAction(
  { require: { module: "leave", action: "approve" }, schema: decideLeaveSchema, audit: { action: "leave.decide", entity: "LeaveRequest" } },
  async (ctx, input) => {
    const req = await prisma.leaveRequest.findFirst({
      where: { id: input.id, tenantId: ctx.tenantId },
      include: { employee: { select: { managerId: true } } },
    });
    if (!req) throw new Error("Request not found");

    // Managers may only decide for their own reports; HR (leave:admin/edit) may decide any.
    const isHr = ctx.ability.can("leave", "edit");
    if (!isHr && req.employee.managerId !== ctx.employeeId) {
      throw new Error("You can only approve requests from your direct reports");
    }

    const action = input.decision === "approve" ? "approve" : "reject";
    if (!canTransition(req.status, action)) {
      throw new Error(`Cannot ${action} a request that is ${req.status}`);
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: req.id },
      data: {
        status: nextStatus(req.status, action),
        approverId: ctx.employeeId,
        decisionNote: input.note || null,
        decidedAt: new Date(),
      },
      select: { id: true },
    });

    revalidatePath("/manager/approvals");
    revalidatePath("/admin/leave");
    revalidatePath("/me/leave");
    return updated;
  },
);

export const cancelLeave = guardedAction(
  { require: { module: "leave", action: "view" }, schema: cancelLeaveSchema, audit: { action: "leave.cancel", entity: "LeaveRequest" } },
  async (ctx, input) => {
    const req = await prisma.leaveRequest.findFirst({ where: { id: input.id, tenantId: ctx.tenantId } });
    if (!req) throw new Error("Request not found");

    const isOwner = req.employeeId === ctx.employeeId;
    const isHr = ctx.ability.can("leave", "edit");
    if (!isOwner && !isHr) throw new Error("You cannot cancel this request");
    if (!canTransition(req.status, "cancel")) {
      throw new Error(`Cannot cancel a request that is ${req.status}`);
    }
    // Employees may only cancel pending/draft; HR may cancel approved too.
    if (isOwner && !isHr && req.status === "approved") {
      throw new Error("Ask your manager or HR to cancel an approved request");
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: req.id },
      data: { status: "cancelled" },
      select: { id: true },
    });
    revalidatePath("/me/leave");
    revalidatePath("/manager/approvals");
    revalidatePath("/admin/leave");
    return updated;
  },
);
