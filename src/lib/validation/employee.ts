import { z } from "zod";
import { EmploymentStatus, ContractType, RightToWorkStatus } from "@prisma/client";
import { niNumberSchema } from "./uk";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: optionalString,
  payrollRef: optionalString,
  niNumber: z.union([niNumberSchema, z.literal("")]).optional(),
  dob: z.coerce.date().optional(),
  startDate: z.coerce.date({ message: "Start date is required" }),
  status: z.nativeEnum(EmploymentStatus).default("onboarding"),
  contractType: z.nativeEnum(ContractType).default("permanent"),
  fte: z.coerce.number().min(0.01).max(1).default(1),
  annualSalary: z.coerce.number().min(0).optional(), // pounds; converted to pence
  rightToWorkStatus: z.nativeEnum(RightToWorkStatus).default("pending"),
  rightToWorkExpiry: z.coerce.date().optional(),
  departmentId: optionalString,
  teamId: optionalString,
  jobTitleId: optionalString,
  siteId: optionalString,
  managerId: optionalString,
});

export type CreateEmployeeInput = z.input<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.string().min(1),
});

export type UpdateEmployeeInput = z.input<typeof updateEmployeeSchema>;
