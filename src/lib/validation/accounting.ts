import { z } from "zod";

export const addCustomerSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export const addSupplierSchema = addCustomerSchema;

export const salesInvoiceSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  number: z.string().trim().min(1, "Invoice number required").max(40),
  description: z.string().trim().max(200).optional(),
  net: z.coerce.number().positive("Net amount must be positive"),
  vatable: z.coerce.boolean().default(true),
  dueAt: z.coerce.date(),
});

export const billSchema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  reference: z.string().trim().max(40).optional(),
  description: z.string().trim().max(200).optional(),
  net: z.coerce.number().positive("Net amount must be positive"),
  vatable: z.coerce.boolean().default(true),
  dueAt: z.coerce.date(),
});

export const ledgerDocIdSchema = z.object({ id: z.string().min(1), kind: z.enum(["invoice", "bill"]) });
