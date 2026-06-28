import { z } from "zod";

// UK National Insurance number: 2 letters (valid prefixes), 6 digits, 1 suffix A-D.
// Excludes invalid prefix letters per HMRC spec.
const NI_REGEX =
  /^(?!BG|GB|NK|KN|TN|NT|ZZ)[ABCEGHJ-PRSTW-Z][ABCEGHJ-NPRSTW-Z]\d{6}[A-D]$/i;

export const niNumberSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s/g, "").toUpperCase())
  .refine((v) => NI_REGEX.test(v), "Invalid UK National Insurance number");

// UK postcode (loose but standard).
const POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
export const postcodeSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .refine((v) => POSTCODE_REGEX.test(v), "Invalid UK postcode");

// Companies House number: 8 chars (digits, or 2 letters + 6 digits).
export const companiesHouseSchema = z
  .string()
  .trim()
  .regex(/^([A-Z]{2}\d{6}|\d{8})$/i, "Invalid Companies House number");

// HMRC Unique Taxpayer Reference: 10 digits.
export const utrSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "UTR must be 10 digits");

export const ukPhoneSchema = z
  .string()
  .trim()
  .regex(/^(\+44\s?|0)\d{9,10}$/, "Invalid UK phone number");

// Money helpers — store as integer pence.
export const poundsToPence = (pounds: number) => Math.round(pounds * 100);
export const penceToPounds = (pence: number) => pence / 100;
export const formatGBP = (pence: number | null | undefined) =>
  pence == null
    ? "—"
    : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
        pence / 100,
      );
