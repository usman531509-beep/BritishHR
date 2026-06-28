import { describe, it, expect } from "vitest";
import { vatReturn, vatOf, profitAndLoss, corporationTax, ctDeadlines } from "./accounting";

describe("VAT", () => {
  it("computes 20% VAT on a net amount", () => {
    expect(vatOf(100_000)).toBe(20_000);
  });
  it("nets output minus input VAT", () => {
    const r = vatReturn(500_000, 100_000, 200_000, 40_000);
    expect(r.vatDue).toBe(60_000);
  });
});

describe("profit & loss", () => {
  it("computes gross and net profit", () => {
    const p = profitAndLoss(1_000_000, 400_000, 250_000);
    expect(p.grossProfit).toBe(600_000);
    expect(p.netProfit).toBe(350_000);
  });
});

describe("corporation tax (FY2024)", () => {
  it("small profits rate 19% below £50k", () => {
    const ct = corporationTax(4_000_000); // £40,000
    expect(ct.rate).toBe("small");
    expect(ct.tax).toBe(760_000); // £7,600
  });
  it("main rate 25% above £250k", () => {
    const ct = corporationTax(30_000_000); // £300,000
    expect(ct.rate).toBe("main");
    expect(ct.tax).toBe(7_500_000); // £75,000
  });
  it("marginal relief between £50k and £250k", () => {
    const ct = corporationTax(10_000_000); // £100,000
    // £100,000×25% − (£250,000−£100,000)×3/200 = £25,000 − £2,250 = £22,750
    expect(ct.rate).toBe("marginal");
    expect(ct.tax).toBe(2_275_000);
  });
  it("pro-rates limits for associated companies", () => {
    // 1 associate: £100k profit (limits £50k–£250k) → marginal.
    expect(corporationTax(10_000_000).rate).toBe("marginal");
    // 2 associates: limits halve to £25k–£125k, so £150k profit is at the main rate.
    expect(corporationTax(15_000_000, { associatedCompanies: 2 }).rate).toBe("main");
  });
});

describe("CT deadlines", () => {
  it("payment due 9 months + 1 day; filing due 12 months", () => {
    const d = ctDeadlines(new Date("2025-03-31T00:00:00Z"));
    expect(d.paymentDue.toISOString().slice(0, 10)).toBe("2026-01-01");
    expect(d.filingDue.toISOString().slice(0, 10)).toBe("2026-03-31");
  });
});
