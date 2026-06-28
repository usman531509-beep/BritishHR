// UK accounting & Corporation Tax engine (FY2024/25). Pure & unit-tested.
// All money is integer PENCE. Estimates for preparation — not a filing.

export const VAT_STANDARD_RATE = 0.2;

// ── VAT ──
export interface VatReturn {
  outputVat: number; // VAT charged on sales
  inputVat: number; // VAT reclaimable on purchases
  vatDue: number; // box 5 (net VAT payable to HMRC; negative = repayment)
  totalSalesExVat: number;
  totalPurchasesExVat: number;
}

export function vatReturn(salesNetPence: number, salesVatPence: number, purchasesNetPence: number, purchasesVatPence: number): VatReturn {
  return {
    outputVat: salesVatPence,
    inputVat: purchasesVatPence,
    vatDue: salesVatPence - purchasesVatPence,
    totalSalesExVat: salesNetPence,
    totalPurchasesExVat: purchasesNetPence,
  };
}

/** VAT amount for a net figure at the standard rate. */
export function vatOf(netPence: number, rate = VAT_STANDARD_RATE): number {
  return Math.round(netPence * rate);
}

// ── Profit & Loss ──
export interface ProfitAndLoss {
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  overheads: number;
  netProfit: number;
}

export function profitAndLoss(revenue: number, costOfSales: number, overheads: number): ProfitAndLoss {
  const grossProfit = revenue - costOfSales;
  return { revenue, costOfSales, grossProfit, overheads, netProfit: grossProfit - overheads };
}

// ── Corporation Tax (FY2024) ──
export const CT_SMALL_PROFITS_RATE = 0.19;
export const CT_MAIN_RATE = 0.25;
export const CT_LOWER_LIMIT = 5_000_000; // £50,000
export const CT_UPPER_LIMIT = 25_000_000; // £250,000
export const CT_MARGINAL_FRACTION = 3 / 200;

export interface CorporationTax {
  taxableProfit: number;
  rate: "small" | "marginal" | "main";
  tax: number;
  effectiveRate: number; // 0–1
}

/**
 * Corporation tax with marginal relief. Limits are pro-rated for short periods
 * and divided by the number of associated companies (default 1).
 */
export function corporationTax(taxableProfitPence: number, opts: { periodMonths?: number; associatedCompanies?: number } = {}): CorporationTax {
  const months = opts.periodMonths ?? 12;
  const associates = Math.max(1, opts.associatedCompanies ?? 1);
  const factor = (months / 12) / associates;
  const lower = CT_LOWER_LIMIT * factor;
  const upper = CT_UPPER_LIMIT * factor;
  const profit = Math.max(0, taxableProfitPence);

  let tax: number;
  let rate: CorporationTax["rate"];
  if (profit <= lower) {
    tax = profit * CT_SMALL_PROFITS_RATE;
    rate = "small";
  } else if (profit >= upper) {
    tax = profit * CT_MAIN_RATE;
    rate = "main";
  } else {
    // Main rate then reduce by marginal relief: (Upper − Profit) × (3/200).
    tax = profit * CT_MAIN_RATE - (upper - profit) * CT_MARGINAL_FRACTION;
    rate = "marginal";
  }
  tax = Math.round(tax);
  return { taxableProfit: profit, rate, tax, effectiveRate: profit > 0 ? tax / profit : 0 };
}

// ── CT deadlines ──
export interface CtDeadlines {
  paymentDue: Date; // 9 months + 1 day after period end (profits < £1.5m)
  filingDue: Date; // 12 months after period end
}

export function ctDeadlines(periodEnd: Date): CtDeadlines {
  const payment = new Date(periodEnd);
  payment.setUTCMonth(payment.getUTCMonth() + 9);
  payment.setUTCDate(payment.getUTCDate() + 1);
  const filing = new Date(periodEnd);
  filing.setUTCFullYear(filing.getUTCFullYear() + 1);
  return { paymentDue: payment, filingDue: filing };
}
