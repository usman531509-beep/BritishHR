"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { guardedAction } from "@/lib/actions/guard";
import { announcementSchema, acknowledgeSchema, raiseTicketSchema } from "@/lib/validation/platform";

export const createAnnouncement = guardedAction(
  { require: { module: "messaging", action: "create" }, schema: announcementSchema, audit: { action: "announcement.create", entity: "Announcement" } },
  async (ctx, input) => {
    const a = await prisma.announcement.create({
      data: {
        tenantId: ctx.tenantId,
        title: input.title,
        body: input.body,
        audience: input.audience,
        departmentId: input.audience === "department" ? input.departmentId || null : null,
        mandatory: input.mandatory,
        publishedByUserId: ctx.userId,
      },
      select: { id: true },
    });
    revalidatePath("/admin/messaging");
    revalidatePath("/me");
    return a;
  },
);

export const acknowledgeAnnouncement = guardedAction(
  { require: { module: "messaging", action: "view" }, schema: acknowledgeSchema, audit: { action: "announcement.acknowledge", entity: "AnnouncementReceipt" } },
  async (ctx, input) => {
    if (!ctx.employeeId) throw new Error("No employee record linked to your account");
    const ann = await prisma.announcement.findFirst({ where: { id: input.announcementId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!ann) throw new Error("Announcement not found");
    const receipt = await prisma.announcementReceipt.upsert({
      where: { announcementId_employeeId: { announcementId: ann.id, employeeId: ctx.employeeId } },
      update: {},
      create: { announcementId: ann.id, employeeId: ctx.employeeId },
      select: { id: true },
    });
    revalidatePath("/me");
    return receipt;
  },
);

export const raiseTicket = guardedAction(
  { require: { module: "support", action: "create" }, schema: raiseTicketSchema, audit: { action: "ticket.raise", entity: "SupportTicket" } },
  async (ctx, input) => {
    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: ctx.tenantId,
        subject: input.subject,
        body: input.body,
        priority: input.priority,
        status: "open",
        createdByUserId: ctx.userId,
      },
      select: { id: true },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/owner/tickets");
    return ticket;
  },
);
