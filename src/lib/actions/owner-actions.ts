"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { platformAction } from "@/lib/actions/guard";
import { provisionTenantSchema, updateSubscriptionSchema, invoiceIdSchema, resolveTicketSchema } from "@/lib/validation/platform";

function invoiceNumber(): string {
  // Deterministic-ish unique number from current time (no Math.random in actions is fine here).
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

export const provisionTenant = platformAction(
  { schema: provisionTenantSchema, audit: { action: "tenant.provision", entity: "Tenant" } },
  async (_ctx, input) => {
    const existing = await prisma.tenant.findUnique({ where: { slug: input.slug }, select: { id: true } });
    if (existing) throw new Error("That slug is already taken");
    const emailTaken = await prisma.user.findUnique({ where: { email: input.adminEmail.toLowerCase() }, select: { id: true } });
    if (emailTaken) throw new Error("That admin email is already registered");

    const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
    if (!plan) throw new Error("Plan not found");

    const hrRole = await prisma.role.findUnique({ where: { key: "HR_ADMIN" }, select: { id: true } });
    if (!hrRole) throw new Error("HR_ADMIN role missing — run the seed");

    const trialEnds = new Date(Date.now() + 14 * 86_400_000);
    const tenant = await prisma.tenant.create({
      data: {
        name: input.companyName,
        slug: input.slug,
        status: "trial",
        subscription: {
          create: { planId: plan.id, status: "trialing", trialEndsAt: trialEnds, currentPeriodEnd: trialEnds },
        },
        users: {
          create: {
            email: input.adminEmail.toLowerCase(),
            name: input.adminName,
            passwordHash: await bcrypt.hash("Password123!", 10),
            roles: { create: { roleId: hrRole.id } },
          },
        },
      },
      select: { id: true },
    });

    revalidatePath("/owner");
    revalidatePath("/owner/companies");
    return { id: tenant.id, tenantId: tenant.id };
  },
);

export const updateSubscription = platformAction(
  { schema: updateSubscriptionSchema, audit: { action: "subscription.update", entity: "Subscription" } },
  async (_ctx, input) => {
    const sub = await prisma.subscription.findUnique({ where: { tenantId: input.tenantId }, select: { id: true } });
    if (!sub) throw new Error("Subscription not found");
    await prisma.subscription.update({ where: { tenantId: input.tenantId }, data: { planId: input.planId, status: input.status } });
    // Keep tenant status roughly in step with billing status.
    const tenantStatus = input.status === "cancelled" ? "cancelled" : input.status === "past_due" ? "suspended" : "active";
    await prisma.tenant.update({ where: { id: input.tenantId }, data: { status: tenantStatus } });
    revalidatePath("/owner/subscriptions");
    revalidatePath(`/owner/companies/${input.tenantId}`);
    return { id: sub.id, tenantId: input.tenantId };
  },
);

export const markInvoicePaid = platformAction(
  { schema: invoiceIdSchema, audit: { action: "invoice.paid", entity: "Invoice" } },
  async (_ctx, input) => {
    const inv = await prisma.invoice.findUnique({ where: { id: input.id }, select: { id: true, tenantId: true } });
    if (!inv) throw new Error("Invoice not found");
    await prisma.invoice.update({ where: { id: inv.id }, data: { status: "paid", paidAt: new Date() } });
    revalidatePath("/owner/subscriptions");
    return { id: inv.id, tenantId: inv.tenantId };
  },
);

export const resolveTicket = platformAction(
  { schema: resolveTicketSchema, audit: { action: "ticket.resolve", entity: "SupportTicket" } },
  async (_ctx, input) => {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: input.id }, select: { id: true, tenantId: true } });
    if (!ticket) throw new Error("Ticket not found");
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: input.status, resolution: input.resolution || null } });
    revalidatePath("/owner/tickets");
    return { id: ticket.id, tenantId: ticket.tenantId };
  },
);

export const toggleFeature = platformAction(
  { schema: z.object({ tenantId: z.string().min(1), flag: z.enum(["accounting"]), enabled: z.coerce.boolean() }), audit: { action: "feature.toggle", entity: "Tenant" } },
  async (_ctx, input) => {
    const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId }, select: { featureFlags: true } });
    if (!tenant) throw new Error("Company not found");
    const flags = { ...(tenant.featureFlags as Record<string, unknown>), [input.flag]: input.enabled };
    await prisma.tenant.update({ where: { id: input.tenantId }, data: { featureFlags: flags } });
    revalidatePath(`/owner/companies/${input.tenantId}`);
    return { id: input.tenantId, tenantId: input.tenantId };
  },
);

// Auto-generate a due invoice for a subscription's current plan (demo billing run).
export const generateInvoice = platformAction(
  { schema: invoiceIdSchema, audit: { action: "invoice.generate", entity: "Invoice" } },
  async (_ctx, input) => {
    // `id` is the tenantId here.
    const sub = await prisma.subscription.findUnique({ where: { tenantId: input.id }, include: { plan: true } });
    if (!sub) throw new Error("Subscription not found");
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: input.id,
        subscriptionId: sub.id,
        number: invoiceNumber(),
        amountPence: sub.plan.monthlyPence,
        status: "due",
        dueAt: new Date(Date.now() + 14 * 86_400_000),
      },
      select: { id: true },
    });
    revalidatePath("/owner/subscriptions");
    return { id: invoice.id, tenantId: input.id };
  },
);
