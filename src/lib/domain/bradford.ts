// Bradford Factor: B = S² × D, where S = number of distinct absence spells
// and D = total days absent, over a rolling period (typically 52 weeks).
// Higher scores flag frequent short-term absence.

export interface AbsenceSpell {
  startDate: Date;
  endDate: Date;
  workingDays: number;
}

export function bradfordFactor(
  spells: AbsenceSpell[],
  opts: { asOf?: Date; windowDays?: number } = {},
): { score: number; spells: number; days: number; band: BradfordBand } {
  const asOf = opts.asOf ?? new Date();
  const windowDays = opts.windowDays ?? 365;
  const cutoff = new Date(asOf.getTime() - windowDays * 86_400_000);

  const inWindow = spells.filter((s) => s.endDate >= cutoff && s.startDate <= asOf);
  const S = inWindow.length;
  const D = inWindow.reduce((sum, s) => sum + s.workingDays, 0);
  const score = S * S * D;
  return { score, spells: S, days: round2(D), band: bradfordBand(score) };
}

export type BradfordBand = "ok" | "review" | "concern" | "action";

// Common employer trigger points (configurable per policy).
export function bradfordBand(score: number): BradfordBand {
  if (score >= 500) return "action";
  if (score >= 200) return "concern";
  if (score >= 51) return "review";
  return "ok";
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
