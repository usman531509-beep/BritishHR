import { describe, it, expect } from "vitest";
import {
  statutoryEntitlementDays,
  proRataEntitlement,
  leaveYearBounds,
  countWorkingDays,
  computeBalance,
} from "./leave";
import { bradfordFactor } from "./bradford";
import { canTransition, nextStatus } from "./leave-state";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe("statutoryEntitlementDays", () => {
  it("gives 28 days for a 5-day week full-timer (5.6 weeks, capped)", () => {
    expect(statutoryEntitlementDays(5, 1)).toBe(28);
  });
  it("gives 16.8 days for a 3-day week", () => {
    expect(statutoryEntitlementDays(3, 1)).toBe(16.8);
  });
  it("pro-rates by FTE", () => {
    expect(statutoryEntitlementDays(5, 0.5)).toBe(14);
  });
  it("caps a 6-day week at 28", () => {
    expect(statutoryEntitlementDays(6, 1)).toBe(28);
  });
});

describe("leaveYearBounds", () => {
  it("computes an April-start leave year", () => {
    const b = leaveYearBounds(d("2025-06-15"), 4, 1);
    expect(b.year).toBe(2025);
    expect(b.start.toISOString().slice(0, 10)).toBe("2025-04-01");
    expect(b.end.toISOString().slice(0, 10)).toBe("2026-03-31");
  });
  it("rolls back to previous year before the start date", () => {
    const b = leaveYearBounds(d("2025-02-10"), 4, 1);
    expect(b.year).toBe(2024);
  });
});

describe("proRataEntitlement", () => {
  it("returns full entitlement for a full year", () => {
    expect(proRataEntitlement(28, d("2025-01-01"), d("2025-12-31"), d("2024-01-01"))).toBe(28);
  });
  it("halves entitlement for a mid-year start", () => {
    const r = proRataEntitlement(28, d("2025-01-01"), d("2025-12-31"), d("2025-07-02"));
    expect(r).toBeGreaterThan(13);
    expect(r).toBeLessThan(15);
  });
});

describe("countWorkingDays", () => {
  it("counts a Mon–Fri week as 5", () => {
    expect(countWorkingDays(d("2025-06-02"), d("2025-06-06"))).toBe(5);
  });
  it("excludes the weekend", () => {
    expect(countWorkingDays(d("2025-06-06"), d("2025-06-09"))).toBe(2); // Fri + Mon
  });
  it("excludes supplied bank holidays", () => {
    expect(countWorkingDays(d("2025-06-02"), d("2025-06-06"), { holidays: [d("2025-06-04")] })).toBe(4);
  });
  it("handles a single half day", () => {
    expect(countWorkingDays(d("2025-06-02"), d("2025-06-02"), { startPart: "pm" })).toBe(0.5);
  });
});

describe("computeBalance", () => {
  it("subtracts taken and pending from entitlement + carry-over", () => {
    const b = computeBalance(28, 2, 10, 3);
    expect(b.entitlement).toBe(30);
    expect(b.remaining).toBe(17);
  });
});

describe("bradfordFactor", () => {
  it("scores S² × D", () => {
    const r = bradfordFactor(
      [
        { startDate: d("2025-01-06"), endDate: d("2025-01-07"), workingDays: 2 },
        { startDate: d("2025-03-03"), endDate: d("2025-03-03"), workingDays: 1 },
        { startDate: d("2025-05-05"), endDate: d("2025-05-05"), workingDays: 1 },
      ],
      { asOf: d("2025-06-01") },
    );
    expect(r.spells).toBe(3);
    expect(r.days).toBe(4);
    expect(r.score).toBe(36); // 3² × 4
    expect(r.band).toBe("ok");
  });
});

describe("leave state machine", () => {
  it("allows pending → approved", () => {
    expect(canTransition("pending", "approve")).toBe(true);
    expect(nextStatus("pending", "approve")).toBe("approved");
  });
  it("forbids approving an already-approved request", () => {
    expect(canTransition("approved", "approve")).toBe(false);
    expect(() => nextStatus("approved", "approve")).toThrow();
  });
});
