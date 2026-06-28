import { z } from "zod";

export const provisionTenantSchema = z.object({
  companyName: z.string().trim().min(1, "Company name required").max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only").max(60),
  planId: z.string().min(1, "Select a plan"),
  adminName: z.string().trim().min(1, "Admin name required").max(120),
  adminEmail: z.string().trim().email("Valid email required"),
});

export const updateSubscriptionSchema = z.object({
  tenantId: z.string().min(1),
  planId: z.string().min(1),
  status: z.enum(["trialing", "active", "past_due", "cancelled"]),
});

export const invoiceIdSchema = z.object({ id: z.string().min(1) });

export const resolveTicketSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  resolution: z.string().trim().max(1000).optional(),
});

// ── Tenant-side (HR) ──
export const raiseTicketSchema = z.object({
  subject: z.string().trim().min(1, "Subject required").max(160),
  body: z.string().trim().min(1, "Describe your issue").max(2000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

// ── Messaging ──
export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(160),
  body: z.string().trim().min(1, "Message required").max(4000),
  audience: z.enum(["all", "department"]).default("all"),
  departmentId: z.string().optional(),
  mandatory: z.coerce.boolean().default(false),
});

export const acknowledgeSchema = z.object({ announcementId: z.string().min(1) });
