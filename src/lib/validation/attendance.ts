import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const clockOutSchema = z.object({
  breakMinutes: z.coerce.number().int().min(0).max(600).default(0),
});

export const approveTimeEntrySchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
});

export const createShiftSchema = z
  .object({
    employeeId: z.string().min(1, "Select an employee"),
    date: z.coerce.date(),
    startTime: z.string().regex(timeRegex, "Use HH:MM"),
    endTime: z.string().regex(timeRegex, "Use HH:MM"),
    breakMinutes: z.coerce.number().int().min(0).max(600).default(0),
    note: z.string().trim().max(200).optional(),
  })
  .refine((v) => v.endTime > v.startTime, { message: "End must be after start", path: ["endTime"] });

export type CreateShiftInput = z.input<typeof createShiftSchema>;
