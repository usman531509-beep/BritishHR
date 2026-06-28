import { z } from "zod";

// ── Immigration / RTW ──
export const recordRtwSchema = z.object({
  employeeId: z.string().min(1),
  checkType: z.enum(["manual", "online_share_code", "idsp"]).default("online_share_code"),
  documentType: z.string().trim().max(120).optional(),
  outcome: z.enum(["passed", "failed", "follow_up"]).default("passed"),
  followUpDate: z.coerce.date().optional(),
  note: z.string().trim().max(500).optional(),
});

export const addVisaSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum([
    "skilled_worker", "health_care_worker", "student", "graduate",
    "family", "settled_status", "pre_settled_status", "other",
  ]).default("skilled_worker"),
  visaNumber: z.string().trim().max(60).optional(),
  sponsored: z.coerce.boolean().default(false),
  cosRef: z.string().trim().max(60).optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
});

export const sponsorLicenceSchema = z.object({
  sponsorLicenceNo: z.string().trim().max(60).optional(),
  sponsorLicenceRating: z.string().trim().max(30).optional(),
  sponsorLicenceExpiry: z.coerce.date().optional(),
});

// ── GDPR ──
export const createDsarSchema = z.object({
  subjectName: z.string().trim().min(1, "Name required").max(120),
  subjectEmail: z.string().trim().email().optional().or(z.literal("")),
  type: z.enum(["access", "erasure", "rectification", "portability", "restriction", "objection"]).default("access"),
  note: z.string().trim().max(500).optional(),
});

export const progressDsarSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["received", "in_progress", "completed", "rejected"]),
});

export const consentSchema = z.object({
  employeeId: z.string().min(1),
  purpose: z.string().trim().min(1).max(160),
  lawfulBasis: z.enum(["consent", "contract", "legal_obligation", "vital_interests", "public_task", "legitimate_interests"]).default("consent"),
  granted: z.coerce.boolean().default(true),
});

// ── Equality (special-category) ──
export const equalitySchema = z.object({
  employeeId: z.string().optional(), // HR may submit on behalf
  gender: z.string().trim().max(40).optional(),
  ethnicity: z.string().trim().max(60).optional(),
  disability: z.string().trim().max(40).optional(),
  religion: z.string().trim().max(60).optional(),
  sexualOrientation: z.string().trim().max(40).optional(),
  maritalStatus: z.string().trim().max(40).optional(),
});

// ── Health & Safety ──
export const riskAssessmentSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(160),
  area: z.string().trim().max(120).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).default("medium"),
  nextReview: z.coerce.date().optional(),
});

export const reviewRiskSchema = z.object({ id: z.string().min(1) });

export const accidentSchema = z.object({
  employeeId: z.string().optional(),
  type: z.enum(["accident", "near_miss", "dangerous_occurrence"]).default("accident"),
  occurredAt: z.coerce.date(),
  location: z.string().trim().max(120).optional(),
  description: z.string().trim().min(1, "Describe the incident").max(1000),
  riddorReportable: z.coerce.boolean().default(false),
});

export const toggleRiddorSchema = z.object({ id: z.string().min(1) });
