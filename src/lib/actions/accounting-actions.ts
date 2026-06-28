"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { guardedAction } from "@/lib/actions/guard";
import { isFeatureEnabled } from "@/lib/features";
import { poundsToPence } from "@/lib/validation/uk";
import { vatOf } from "@/lib/domain/accounting";
import { addCustomerSchema, addSupplierSchema, salesInvoiceSchema, billSchema, ledgerDocIdSchema } from "@/lib/validation/accounting";

async function assertAccounting(tenantId: string) {
  if (!(await isFeatureEnabled(tenantId, "accounting"))) {
    throw new Error("The Accounting module is not enabled for your company");
  }
}

export const addCustomer = guardedAction(
  { require: { module: "accounting", action: "create" }, schema: addCustomerSchema, audit: { action: "customer.add", entity: "Customer" } },
  async (ctx, input) => {
    await assertAccounting(ctx.tenantId);
    const c = await prisma.customer.create({ data: { tenantId: ctx.tenantId, name: input.name, email: input.email || null }, select: { id: true } });
    revalidatePath("/admin/financial");
    return c;
  },
);

export const addSupplier = guardedAction(
  { require: { module: "accounting", action: "create" }, schema: addSupplierSchema, audit: { action: "supplier.add", entity: "Supplier" } },
  async (ctx, input) => {
    await assertAccounting(ctx.tenantId);
    const s = await prisma.supplier.create({ data: { tenantId: ctx.tenantId, name: input.name, email: input.email || null }, select: { id: true } });
    revalidatePath("/admin/financial");
    return s;
  },
);

export const createSalesInvoice = guardedAction(
  { require: { module: "accounting", action: "create" }, schema: salesInvoiceSchema, audit: { action: "salesInvoice.create", entity: "SalesInvoice" } },
  async (ctx, input) => {
    await assertAccounting(ctx.tenantId);
    const cust = await prisma.customer.findFirst({ where: { id: input.customerId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!cust) throw new Error("Customer not found");
    const net = poundsToPence(input.net);
    const inv = await prisma.salesInvoice.create({
      data: {
        tenantId: ctx.tenantId, customerId: cust.id, number: input.number, description: input.description || null,
        netPence: net, vatPence: input.vatable ? vatOf(net) : 0, status: "sent", dueAt: input.dueAt,
      },
      select: { id: true },
    });
    revalidatePath("/admin/financial");
    revalidatePath("/admin/ct600");
    return inv;
  },
);

export const createBill = guardedAction(
  { require: { module: "accounting", action: "create" }, schema: billSchema, audit: { action: "bill.create", entity: "Bill" } },
  async (ctx, input) => {
    await assertAccounting(ctx.tenantId);
    const sup = await prisma.supplier.findFirst({ where: { id: input.supplierId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!sup) throw new Error("Supplier not found");
    const net = poundsToPence(input.net);
    const bill = await prisma.bill.create({
      data: {
        tenantId: ctx.tenantId, supplierId: sup.id, reference: input.reference || null, description: input.description || null,
        netPence: net, vatPence: input.vatable ? vatOf(net) : 0, status: "sent", dueAt: input.dueAt,
      },
      select: { id: true },
    });
    revalidatePath("/admin/financial");
    revalidatePath("/admin/ct600");
    return bill;
  },
);

export const markLedgerPaid = guardedAction(
  { require: { module: "accounting", action: "edit" }, schema: ledgerDocIdSchema, audit: { action: "ledger.markPaid", entity: "Ledger" } },
  async (ctx, input) => {
    await assertAccounting(ctx.tenantId);
    if (input.kind === "invoice") {
      const inv = await prisma.salesInvoice.findFirst({ where: { id: input.id, tenantId: ctx.tenantId }, select: { id: true } });
      if (!inv) throw new Error("Invoice not found");
      await prisma.salesInvoice.update({ where: { id: inv.id }, data: { status: "paid", paidAt: new Date() } });
    } else {
      const bill = await prisma.bill.findFirst({ where: { id: input.id, tenantId: ctx.tenantId }, select: { id: true } });
      if (!bill) throw new Error("Bill not found");
      await prisma.bill.update({ where: { id: bill.id }, data: { status: "paid", paidAt: new Date() } });
    }
    revalidatePath("/admin/financial");
    return { id: input.id };
  },
);
