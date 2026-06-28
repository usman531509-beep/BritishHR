import { describe, it, expect } from "vitest";
import {
  workedHours,
  totalHours,
  wtdAverageWeekly,
  weeklyCompliance,
  dailyRestHours,
  restBreaches,
  requiresRestBreak,
  scheduledHours,
} from "./attendance";
import { canMoveStage, isTerminal } from "./recruitment";
import { checklistProgress, dueDateFor } from "./onboarding";

const t = (s: string) => new Date(`2025-06-02T${s}:00.000Z`);

describe("attendance engine", () => {
  it("computes worked hours minus break", () => {
    expect(workedHours(t("09:00"), t("17:30"), 30)).toBe(8);
  });
  it("returns 0 for an open entry (no clock-out)", () => {
    expect(workedHours(t("09:00"), null, 0)).toBe(0);
  });
  it("sums total hours across periods", () => {
    expect(totalHours([
      { clockIn: t("09:00"), clockOut: t("12:00") },
      { clockIn: t("13:00"), clockOut: t("17:00"), breakMinutes: 0 },
    ])).toBe(7);
  });
  it("flags WTD 48h average breach", () => {
    expect(wtdAverageWeekly(17 * 50).breaches).toBe(true);
    expect(wtdAverageWeekly(17 * 40).breaches).toBe(false);
  });
  it("flags a single week over 48h", () => {
    const periods = Array.from({ length: 6 }, () => ({ clockIn: t("08:00"), clockOut: t("17:00") }));
    expect(weeklyCompliance(periods).breaches48).toBe(true); // 6 × 9 = 54h
  });
  it("computes daily rest and rest breaches", () => {
    const out = new Date("2025-06-02T22:00:00Z");
    const next = new Date("2025-06-03T06:00:00Z");
    expect(dailyRestHours(out, next)).toBe(8);
    expect(restBreaches(out, next)).toBe(true); // < 11h
  });
  it("requires a break for shifts over 6h", () => {
    expect(requiresRestBreak(6.5)).toBe(true);
    expect(requiresRestBreak(5)).toBe(false);
  });
  it("computes scheduled hours from HH:MM", () => {
    expect(scheduledHours("09:00", "17:00", 60)).toBe(7);
  });
});

describe("recruitment pipeline", () => {
  it("allows valid forward moves", () => {
    expect(canMoveStage("applied", "screening")).toBe(true);
    expect(canMoveStage("interview", "offer")).toBe(true);
  });
  it("blocks invalid moves", () => {
    expect(canMoveStage("applied", "hired")).toBe(false);
    expect(canMoveStage("hired", "offer")).toBe(false);
  });
  it("identifies terminal stages", () => {
    expect(isTerminal("hired")).toBe(true);
    expect(isTerminal("applied")).toBe(false);
  });
});

describe("onboarding", () => {
  it("computes checklist progress", () => {
    expect(checklistProgress([{ status: "done" }, { status: "pending" }, { status: "done" }, { status: "in_progress" }])).toBe(50);
    expect(checklistProgress([])).toBe(0);
  });
  it("computes due date from start + offset", () => {
    const due = dueDateFor(new Date("2025-06-01T00:00:00Z"), 7);
    expect(due.toISOString().slice(0, 10)).toBe("2025-06-08");
  });
});
