// UK payroll calculation engine (2024/25, England & Northern Ireland bands).
// Pure & unit-tested. All money is integer PENCE. These are ESTIMATES for
// payroll preparation — annual figures apportioned per period — not a
// substitute for RTI-accurate cumulative payroll.
//
// Tax-year constants are isolated here so a new year is a one-place change.

export const TAX_YEAR = "2024/25";

// ── Income Tax (rUK) ──
const PERSONAL_ALLOWANCE = 1_257_000; // £12,570
const BASIC_BAND = 3_770_000; // £37,700 of taxable income at 20%
const ADDITIONAL_INCOME_LIMIT = 12_514_000; // £125,140
const PA_TAPER_START = 10_000_000; // £100,000
const RATE_BASIC = 0.2;
const RATE_HIGHER = 0.4;
const RATE_ADDITIONAL = 0.45;

// ── National Insurance (Class 1) ──
const NI_PRIMARY_THRESHOLD = 1_257_000; // £12,570
const NI_UPPER_EARNINGS_LIMIT = 5_027_000; // £50,270
const NI_SECONDARY_THRESHOLD = 910_000; // £9,100
const NI_EMPLOYEE_MAIN = 0.08;
const NI_EMPLOYEE_UPPER = 0.02;
const NI_EMPLOYER_RATE = 0.138;

// ── Pension auto-enrolment ──
export const QE_LOWER = 624_000; // £6,240
export const QE_UPPER = 5_027_000; // £50,270
export const AE_EARNINGS_TRIGGER = 1_000_000; // £10,000
export const AE_MIN_EMPLOYEE = 0.05;
export const AE_MIN_EMPLOYER = 0.03;
const STATE_PENSION_AGE = 66;

// ── Student loans (annual thresholds, pence) ──
export const STUDENT_LOAN_PLANS = {
  plan1: { threshold: 2_499_000, rate: 0.09 }, // £24,990
  plan2: { threshold: 2_729_500, rate: 0.09 }, // £27,295
  plan4: { threshold: 3_139_500, rate: 0.09 }, // £31,395
  postgrad: { threshold: 2_100_000, rate: 0.06 }, // £21,000
} as const;
export type StudentLoanPlan = keyof typeof STUDENT_LOAN_PLANS;

// ── Statutory pay (weekly, pence) ──
export const SSP_WEEKLY = 11_675; // £116.75
export const SSP_MAX_WEEKS = 28;
export const SSP_WAITING_DAYS = 3;
export const STAT_FAMILY_FLAT_WEEKLY = 18_403; // £184.03 (SMP/SPP/SAP/ShPP)

const p2 = (n: number) => Math.round(n); // already pence; round to whole penny
const clampPos = (n: number) => Math.max(0, n);

export function personalAllowance(annualGrossPence: number): number {
  if (annualGrossPence <= PA_TAPER_START) return PERSONAL_ALLOWANCE;
  const reduction = Math.floor((annualGrossPence - PA_TAPER_START) / 2);
  return clampPos(PERSONAL_ALLOWANCE - reduction);
}

export function incomeTaxAnnual(annualGrossPence: number): number {
  const pa = personalAllowance(annualGrossPence);
  const taxable = clampPos(annualGrossPence - pa);
  const additionalEdge = clampPos(ADDITIONAL_INCOME_LIMIT - pa); // taxable where 45% begins
  const band20 = Math.min(taxable, BASIC_BAND);
  const band40 = clampPos(Math.min(taxable, additionalEdge) - BASIC_BAND);
  const band45 = clampPos(taxable - additionalEdge);
  return p2(band20 * RATE_BASIC + band40 * RATE_HIGHER + band45 * RATE_ADDITIONAL);
}

export function employeeNiAnnual(annualGrossPence: number): number {
  const main = clampPos(Math.min(annualGrossPence, NI_UPPER_EARNINGS_LIMIT) - NI_PRIMARY_THRESHOLD) * NI_EMPLOYEE_MAIN;
  const upper = clampPos(annualGrossPence - NI_UPPER_EARNINGS_LIMIT) * NI_EMPLOYEE_UPPER;
  return p2(main + upper);
}

export function employerNiAnnual(annualGrossPence: number): number {
  return p2(clampPos(annualGrossPence - NI_SECONDARY_THRESHOLD) * NI_EMPLOYER_RATE);
}

export function qualifyingEarnings(annualGrossPence: number): number {
  return clampPos(Math.min(annualGrossPence, QE_UPPER) - QE_LOWER);
}

export function studentLoanAnnual(annualGrossPence: number, plan: StudentLoanPlan): number {
  const { threshold, rate } = STUDENT_LOAN_PLANS[plan];
  return p2(clampPos(annualGrossPence - threshold) * rate);
}

export type AeCategory = "eligible" | "non_eligible" | "entitled";

/** UK auto-enrolment worker categorisation. */
export function assessAutoEnrolment(age: number, annualGrossPence: number): AeCategory {
  if (age >= 22 && age < STATE_PENSION_AGE && annualGrossPence > AE_EARNINGS_TRIGGER) return "eligible";
  if (annualGrossPence > QE_LOWER) return "non_eligible"; // non-eligible jobholder
  return "entitled"; // entitled worker
}

export interface PayslipInput {
  annualSalaryPence: number;
  periodsPerYear?: number; // 12 monthly (default)
  pensionEmployeeRate?: number; // e.g. 0.05
  pensionEmployerRate?: number; // e.g. 0.03
  studentLoanPlan?: StudentLoanPlan | null;
}

export interface PayslipBreakdown {
  grossPence: number;
  incomeTaxPence: number;
  employeeNiPence: number;
  employerNiPence: number;
  pensionEmployeePence: number;
  pensionEmployerPence: number;
  studentLoanPence: number;
  netPence: number;
  taxYear: string;
  periodsPerYear: number;
}

/** Compute one pay-period payslip by apportioning annual figures. */
export function computePayslip(input: PayslipInput): PayslipBreakdown {
  const periods = input.periodsPerYear ?? 12;
  const eeRate = input.pensionEmployeeRate ?? 0;
  const erRate = input.pensionEmployerRate ?? 0;
  const annual = input.annualSalaryPence;

  const gross = p2(annual / periods);
  const tax = p2(incomeTaxAnnual(annual) / periods);
  const eeNi = p2(employeeNiAnnual(annual) / periods);
  const erNi = p2(employerNiAnnual(annual) / periods);
  const qe = qualifyingEarnings(annual);
  const eePension = p2((qe * eeRate) / periods);
  const erPension = p2((qe * erRate) / periods);
  const studentLoan = input.studentLoanPlan ? p2(studentLoanAnnual(annual, input.studentLoanPlan) / periods) : 0;

  const net = gross - tax - eeNi - eePension - studentLoan;
  return {
    grossPence: gross,
    incomeTaxPence: tax,
    employeeNiPence: eeNi,
    employerNiPence: erNi,
    pensionEmployeePence: eePension,
    pensionEmployerPence: erPension,
    studentLoanPence: studentLoan,
    netPence: net,
    taxYear: TAX_YEAR,
    periodsPerYear: periods,
  };
}

// ── Statutory pay schedules ──

/** SSP payable for a sickness spell of `sickDays` working days (3 waiting days unpaid). */
export function sspForSpell(sickWorkingDays: number, qualifyingDaysPerWeek = 5): number {
  const payableDays = clampPos(sickWorkingDays - SSP_WAITING_DAYS);
  const dailyRate = SSP_WEEKLY / qualifyingDaysPerWeek;
  const cappedDays = Math.min(payableDays, SSP_MAX_WEEKS * qualifyingDaysPerWeek);
  return p2(cappedDays * dailyRate);
}

/**
 * SMP/SAP total: 6 weeks at 90% of average weekly earnings, then 33 weeks at
 * the lower of 90% AWE or the statutory flat rate.
 */
export function smpTotal(averageWeeklyEarningsPence: number): number {
  const ninety = averageWeeklyEarningsPence * 0.9;
  const first6 = ninety * 6;
  const next33 = Math.min(ninety, STAT_FAMILY_FLAT_WEEKLY) * 33;
  return p2(first6 + next33);
}

/** SPP/ShPP: up to 2 weeks at the lower of 90% AWE or the flat rate. */
export function sppTotal(averageWeeklyEarningsPence: number, weeks = 2): number {
  return p2(Math.min(averageWeeklyEarningsPence * 0.9, STAT_FAMILY_FLAT_WEEKLY) * weeks);
}
