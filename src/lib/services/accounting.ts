import { prisma } from "@/lib/db/prisma";
import { vatReturn, profitAndLoss, corporationTax, ctDeadlines } from "@/lib/domain/accounting";

export async function financialOverview(tenantId: string) {
  const [invoices, bills, customers, suppliers] = await Promise.all([
    prisma.salesInvoice.findMany({ where: { tenantId }, include: { customer: { select: { name: true } } }, orderBy: { issuedAt: "desc" }, take: 100 }),
    prisma.bill.findMany({ where: { tenantId }, include: { supplier: { select: { name: true } } }, orderBy: { issuedAt: "desc" }, take: 100 }),
    prisma.customer.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
  ]);

  const salesNet = invoices.reduce((s, i) => s + i.netPence, 0);
  const salesVat = invoices.reduce((s, i) => s + i.vatPence, 0);
  const purchasesNet = bills.reduce((s, b) => s + b.netPence, 0);
  const purchasesVat = bills.reduce((s, b) => s + b.vatPence, 0);

  const vat = vatReturn(salesNet, salesVat, purchasesNet, purchasesVat);
  const pl = profitAndLoss(salesNet, 0, purchasesNet);
  const agedReceivables = invoices.filter((i) => i.status !== "paid" && i.status !== "void").reduce((s, i) => s + i.netPence + i.vatPence, 0);
  const agedPayables = bills.filter((b) => b.status !== "paid" && b.status !== "void").reduce((s, b) => s + b.netPence + b.vatPence, 0);

  return { invoices, bills, customers, suppliers, vat, pl, agedReceivables, agedPayables };
}

/** Corporation-tax computation derived from the accounting net profit. */
export async function ctComputation(tenantId: string) {
  const [salesAgg, billsAgg] = await Promise.all([
    prisma.salesInvoice.aggregate({ where: { tenantId }, _sum: { netPence: true } }),
    prisma.bill.aggregate({ where: { tenantId }, _sum: { netPence: true } }),
  ]);
  const revenue = salesAgg._sum.netPence ?? 0;
  const expenses = billsAgg._sum.netPence ?? 0;
  const pl = profitAndLoss(revenue, 0, expenses);
  const ct = corporationTax(pl.netProfit);

  // Demo accounting period: company financial year to 31 March.
  const periodEnd = new Date(Date.UTC(new Date().getUTCFullYear(), 2, 31));
  const deadlines = ctDeadlines(periodEnd);
  return { pl, ct, periodEnd, deadlines };
}
