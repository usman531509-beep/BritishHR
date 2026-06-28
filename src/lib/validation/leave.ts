import { z } from "zod";

export const requestLeaveSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Select a leave type"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    startPart: z.enum(["full", "am", "pm"]).default("full"),
    endPart: z.enum(["full", "am", "pm"]).default("full"),
    reason: z.string().trim().max(500).optional(),
    // HR may book on behalf of an employee.
    employeeId: z.string().optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type RequestLeaveInput = z.input<typeof requestLeaveSchema>;

export const decideLeaveSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional(),
});

export const cancelLeaveSchema = z.object({ id: z.string().min(1) });
