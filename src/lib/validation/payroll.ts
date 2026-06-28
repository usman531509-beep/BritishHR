import { z } from "zod";

export const createPayRunSchema = z.object({
  periodLabel: z.string().trim().min(1, "Period label required").max(40),
  payDate: z.coerce.date(),
  frequency: z.enum(["monthly", "weekly", "fortnightly"]).default("monthly"),
});

export const payRunIdSchema = z.object({ id: z.string().min(1) });

export const pensionEnrolSchema = z.object({
  employeeId: z.string().min(1),
  status: z.enum(["enrolled", "opted_out", "postponed", "not_eligible"]),
});

export const submitExpenseSchema = z.object({
  category: z.enum(["mileage", "travel", "subsistence", "equipment", "training", "other"]).default("other"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().trim().min(1, "Description required").max(300),
  incurredOn: z.coerce.date(),
  employeeId: z.string().optional(), // HR may file on behalf
});

export const decideExpenseSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["approve", "reject", "paid"]),
});

export const addBenefitSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(["company_car", "private_medical", "fuel", "loan", "accommodation", "other"]).default("other"),
  description: z.string().trim().max(160).optional(),
  cashEquivalent: z.coerce.number().min(0),
});
