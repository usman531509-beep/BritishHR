import { describe, it, expect } from "vitest";
import {
  daysUntil,
  expirySeverity,
  dsarDueDate,
  complianceScore,
  scoreBand,
  anonymisedCounts,
} from "./compliance";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe("daysUntil / expirySeverity", () => {
  it("counts days to a future date", () => {
    expect(daysUntil(d("2025-01-31"), d("2025-01-01"))).toBe(30);
  });
  it("is negative when overdue", () => {
    expect(daysUntil(d("2024-12-25"), d("2025-01-01"))).toBeLessThan(0);
  });
  it("grades severity by window", () => {
    expect(expirySeverity(10)).toBe("critical");
    expect(expirySeverity(45)).toBe("warning");
    expect(expirySeverity(120)).toBe("info");
    expect(expirySeverity(-3)).toBe("critical");
  });
});

describe("dsarDueDate (statutory 1 calendar month)", () => {
  it("adds one month", () => {
    expect(dsarDueDate(d("2025-03-10")).toISOString().slice(0, 10)).toBe("2025-04-10");
  });
  it("clamps to month end when the day doesn't exist", () => {
    // 31 Jan + 1 month → 28 Feb (2025 not a leap year)
    expect(dsarDueDate(d("2025-01-31")).toISOString().slice(0, 10)).toBe("2025-02-28");
  });
});

describe("complianceScore", () => {
  it("is 100 with nothing monitored", () => {
    expect(complianceScore({ total: 0, failing: 0, warning: 0 })).toBe(100);
  });
  it("is 100 when all pass", () => {
    expect(complianceScore({ total: 10, failing: 0, warning: 0 })).toBe(100);
  });
  it("penalises criticals fully and warnings by half", () => {
    expect(complianceScore({ total: 10, failing: 1, warning: 2 })).toBe(80); // (1 + 1)/10 = 20%
  });
  it("bands the score", () => {
    expect(scoreBand(95)).toBe("info");
    expect(scoreBand(75)).toBe("warning");
    expect(scoreBand(50)).toBe("critical");
  });
});

describe("anonymisedCounts", () => {
  it("suppresses groups below the threshold", () => {
    const data = [
      ...Array(6).fill("Female"),
      ...Array(5).fill("Male"),
      ...Array(2).fill("Other"),
    ];
    const out = anonymisedCounts(data, 5);
    expect(out["Female"]).toBe(6);
    expect(out["Male"]).toBe(5);
    expect(out["Other"]).toBeUndefined();
    expect(out["Not disclosed / suppressed"]).toBe(2);
  });
});
