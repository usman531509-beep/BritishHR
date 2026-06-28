// UK compliance engine: alert aggregation, severity, compliance score and the
// statutory DSAR deadline. Pure & unit-tested.

export type Severity = "critical" | "warning" | "info";
export type AlertCategory = "right_to_work" | "immigration" | "gdpr" | "health_safety" | "document";

export interface ComplianceAlert {
  category: AlertCategory;
  severity: Severity;
  title: string;
  detail: string;
  dueInDays?: number;
}

export const DAY = 86_400_000;

/** Whole days from now until `date` (negative = overdue). */
export function daysUntil(date: Date, now = new Date()): number {
  return Math.ceil((date.getTime() - now.getTime()) / DAY);
}

/** Expiry severity: overdue/≤30d critical, ≤60d warning, else info. */
export function expirySeverity(days: number): Severity {
  if (days <= 30) return "critical";
  if (days <= 60) return "warning";
  return "info";
}

/**
 * Statutory DSAR deadline: one calendar month from receipt (UK GDPR).
 * If the day-of-month doesn't exist in the target month, use the last day.
 */
export function dsarDueDate(received: Date): Date {
  const d = new Date(received);
  const targetMonth = d.getUTCMonth() + 1;
  const due = new Date(Date.UTC(d.getUTCFullYear(), targetMonth, d.getUTCDate()));
  // If overflowed into a later month (e.g. 31 Jan → 3 Mar), clamp to month end.
  if (due.getUTCMonth() !== ((targetMonth % 12))) {
    return new Date(Date.UTC(d.getUTCFullYear(), targetMonth + 1, 0));
  }
  return due;
}

export interface ScoreInput {
  total: number;   // total items checked
  failing: number; // items that breach (critical)
  warning: number; // items at warning
}

/**
 * Compliance score 0–100. Each critical item costs full weight, each warning
 * half weight, relative to total monitored items.
 */
export function complianceScore({ total, failing, warning }: ScoreInput): number {
  if (total <= 0) return 100;
  const penalty = (failing + warning * 0.5) / total;
  return Math.max(0, Math.round((1 - penalty) * 100));
}

export function scoreBand(score: number): Severity {
  if (score >= 90) return "info";
  if (score >= 70) return "warning";
  return "critical";
}

/**
 * Anonymised equality aggregation: returns counts per value but suppresses
 * any group smaller than `minGroup` (default 5) to prevent re-identification.
 */
export function anonymisedCounts(values: (string | null)[], minGroup = 5): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of values) {
    if (!v) continue;
    counts[v] = (counts[v] ?? 0) + 1;
  }
  const out: Record<string, number> = {};
  let suppressed = 0;
  for (const [k, n] of Object.entries(counts)) {
    if (n >= minGroup) out[k] = n;
    else suppressed += n;
  }
  if (suppressed > 0) out["Not disclosed / suppressed"] = suppressed;
  return out;
}
