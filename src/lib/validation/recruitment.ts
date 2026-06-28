import { z } from "zod";

export const createVacancySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  departmentId: z.string().optional(),
  positions: z.coerce.number().int().min(1).max(100).default(1),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  description: z.string().trim().max(2000).optional(),
});

export const addCandidateSchema = z.object({
  vacancyId: z.string().min(1),
  firstName: z.string().trim().min(1, "First name required").max(80),
  lastName: z.string().trim().min(1, "Last name required").max(80),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  source: z.string().trim().max(60).optional(),
});

export const moveStageSchema = z.object({
  applicationId: z.string().min(1),
  toStage: z.enum(["applied", "screening", "interview", "offer", "hired", "rejected", "withdrawn"]),
});

export const makeOfferSchema = z.object({
  applicationId: z.string().min(1),
  salary: z.coerce.number().min(0),
  startDate: z.coerce.date().optional(),
});
