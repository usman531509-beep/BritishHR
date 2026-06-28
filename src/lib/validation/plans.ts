import { z } from "zod";

export const planSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(60),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price can't be negative"), // pounds/month
  maxEmployees: z.coerce.number().int().min(0).default(0), // 0 = unlimited
  features: z.string().max(2000).optional().or(z.literal("")), // one feature per line
  ctaText: z.string().trim().max(40).default("Start free trial"),
  isPopular: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const planIdSchema = z.object({ id: z.string().min(1) });
