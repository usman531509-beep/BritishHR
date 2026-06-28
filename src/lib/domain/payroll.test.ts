import { describe, it, expect } from "vitest";
import {
  personalAllowance,
  incomeTaxAnnual,
  employeeNiAnnual,
  employerNiAnnual,
  qualifyingEarnings,
  studentLoanAnnual,
  assessAutoEnrolment,
  computePayslip,
  sspForSpell,
  smpTotal,
  sppTotal,
} from "./payroll";

// All values in pence. £ figures hand-verified against 2024/25 rUK bands.

describe("personal allowance + taper", () => {
  it("is full below £100k", () => {
    expect(personalAllowance(3_000_000)).toBe(1_257_000);
  });
  it("tapers £1 per £2 over £100k", () => {
    expect(personalAllowance(11_000_000)).toBe(757_000); // £110k → PA £7,570
  });
  it("is zero at £125,140", () => {
    expect(personalAllowance(12_514_000)).toBe(0);
  });
});

describe("income tax (annual)", () => {
  it("£30,000 → £3,486", () => {
    expect(incomeTaxAnnual(3_000_000)).toBe(348_600);
  });
  it("£60,000 → £11,432", () => {
    expect(incomeTaxAnnual(6_000_000)).toBe(1_143_200);
  });
  it("£120,000 (tapered PA) → £39,432", () => {
    expect(incomeTaxAnnual(12_000_000)).toBe(3_943_200);
  });
  it("no tax below the personal allowance", () => {
    expect(incomeTaxAnnual(1_000_000)).toBe(0);
  });
});

describe("national insurance (annual)", () => {
  it("employee £30,000 → £1,394.40", () => {
    expect(employeeNiAnnual(3_000_000)).toBe(139_440);
  });
  it("employee £60,000 → £3,210.60", () => {
    expect(employeeNiAnnual(6_000_000)).toBe(321_060);
  });
  it("employer £30,000 → £2,884.20", () => {
    expect(employerNiAnnual(3_000_000)).toBe(288_420);
  });
});

describe("pension qualifying earnings", () => {
  it("bands £6,240–£50,270", () => {
    expect(qualifyingEarnings(3_000_000)).toBe(3_000_000 - 624_000);
    expect(qualifyingEarnings(6_000_000)).toBe(5_027_000 - 624_000);
  });
});

describe("auto-enrolment assessment", () => {
  it("eligible jobholder (22–SPA, >£10k)", () => {
    expect(assessAutoEnrolment(30, 3_000_000)).toBe("eligible");
  });
  it("non-eligible jobholder (under 22 but earning)", () => {
    expect(assessAutoEnrolment(19, 1_500_000)).toBe("non_eligible");
  });
  it("entitled worker (low earnings)", () => {
    expect(assessAutoEnrolment(40, 500_000)).toBe("entitled");
  });
});

describe("student loan", () => {
  it("Plan 2 £40,000 → 9% over £27,295 = £1,143.45", () => {
    expect(studentLoanAnnual(4_000_000, "plan2")).toBe(114_345);
  });
  it("nothing below threshold", () => {
    expect(studentLoanAnnual(2_000_000, "plan2")).toBe(0);
  });
});

describe("computePayslip (monthly)", () => {
  it("£30,000 with 5% pension yields consistent net", () => {
    const p = computePayslip({ annualSalaryPence: 3_000_000, pensionEmployeeRate: 0.05, pensionEmployerRate: 0.03 });
    expect(p.grossPence).toBe(250_000); // £2,500
    expect(p.incomeTaxPence).toBe(29_050); // £3,486 / 12
    expect(p.employeeNiPence).toBe(11_620); // £1,394.40 / 12
    // qualifying earnings £23,760 × 5% / 12 = £99.00
    expect(p.pensionEmployeePence).toBe(9_900);
    expect(p.netPence).toBe(p.grossPence - p.incomeTaxPence - p.employeeNiPence - p.pensionEmployeePence);
  });
});

describe("statutory pay", () => {
  it("SSP excludes 3 waiting days", () => {
    // 8 sick days, 5-day week → 5 payable days × (£116.75/5)
    expect(sspForSpell(8, 5)).toBe(Math.round(5 * (11_675 / 5)));
  });
  it("SMP: 6 weeks @90% + 33 weeks capped at flat rate", () => {
    const awe = 60_000; // £600/week → 90% = £540 > flat £184.03
    expect(smpTotal(awe)).toBe(Math.round(awe * 0.9 * 6 + 18_403 * 33));
  });
  it("SPP: 2 weeks at the lower of 90% AWE or flat rate", () => {
    expect(sppTotal(60_000)).toBe(18_403 * 2);
  });
});
