"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { guardedAction } from "@/lib/actions/guard";
import { poundsToPence } from "@/lib/validation/uk";
import { computePayslip, TAX_YEAR } from "@/lib/domain/payroll";
import {
  createPayRunSchema, payRunIdSchema, pensionEnrolSchema,
  submitExpenseSchema, decideExpenseSchema, addBenefitSchema,
} from "@/lib/validation/payroll";

const FREQ_PERIODS = { monthly: 12, weekly: 52, fortnightly: 26 } as const;

export const createPayRun = guardedAction(
  { require: { module: "payroll", action: "create" }, schema: createPayRunSchema, audit: { action: "payrun.create", entity: "PayRun" } },
  async (ctx, input) => {
    const periods = FREQ_PERIODS[input.frequency];

    // Employees to pay, with their pension enrolment + default scheme rates.
    const [employees, scheme] = await Promise.all([
      prisma.employee.findMany({
        where: { tenantId: ctx.tenantId, deletedAt: null, status: { in: ["active", "on_leave"] }, annualSalaryPence: { not: null } },
        select: { id: true, annualSalaryPence: true, pensionEnrolment: { select: { status: true } } },
      }),
      prisma.pensionScheme.findFirst({ where: { tenantId: ctx.tenantId, isDefault: true } }),
    ]);
    if (employees.length === 0) throw new Error("No payable employees with a salary set");

    const eeRate = scheme?.employeeRate ?? 0.05;
    const erRate = scheme?.employerRate ?? 0.03;

    const payRun = await prisma.payRun.create({
      data: { tenantId: ctx.tenantId, periodLabel: input.periodLabel, payDate: input.payDate, frequency: input.frequency, taxYear: TAX_YEAR, status: "draft" },
      select: { id: true },
    });

    await prisma.payslip.createMany({
      data: employees.map((e) => {
        const enrolled = e.pensionEnrolment?.status === "enrolled";
        const b = computePayslip({
          annualSalaryPence: e.annualSalaryPence!,
          periodsPerYear: periods,
          pensionEmployeeRate: enrolled ? eeRate : 0,
          pensionEmployerRate: enrolled ? erRate : 0,
        });
        return {
          tenantId: ctx.tenantId,
          payRunId: payRun.id,
          employeeId: e.id,
          grossPence: b.grossPence,
          incomeTaxPence: b.incomeTaxPence,
          employeeNiPence: b.employeeNiPence,
          employerNiPence: b.employerNiPence,
          pensionEmployeePence: b.pensionEmployeePence,
          pensionEmployerPence: b.pensionEmployerPence,
          studentLoanPence: b.studentLoanPence,
          netPence: b.netPence,
          taxYear: b.taxYear,
          breakdown: b as unknown as object,
        };
      }),
    });

    revalidatePath("/admin/payroll");
    return payRun;
  },
);

export const finalisePayRun = guardedAction(
  { require: { module: "payroll", action: "edit" }, schema: payRunIdSchema, audit: { action: "payrun.finalise", entity: "PayRun" } },
  async (ctx, input) => {
    const run = await prisma.payRun.findFirst({ where: { id: input.id, tenantId: ctx.tenantId }, select: { id: true, status: true } });
    if (!run) throw new Error("Pay run not found");
    if (run.status === "finalised") throw new Error("Pay run already finalised");
    const updated = await prisma.payRun.update({ where: { id: run.id }, data: { status: "finalised" }, select: { id: true } });
    revalidatePath("/admin/payroll");
    revalidatePath("/me/payslips");
    return updated;
  },
);

export const setPensionEnrolment = guardedAction(
  { require: { module: "payroll", action: "edit" }, schema: pensionEnrolSchema, audit: { action: "pension.enrol", entity: "PensionEnrolment" } },
  async (ctx, input) => {
    const emp = await prisma.employee.findFirst({ where: { id: input.employeeId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!emp) throw new Error("Employee not found");
    const scheme = await prisma.pensionScheme.findFirst({ where: { tenantId: ctx.tenantId, isDefault: true }, select: { id: true } });
    const enrolment = await prisma.pensionEnrolment.upsert({
      where: { employeeId: emp.id },
      update: { status: input.status, optedOutAt: input.status === "opted_out" ? new Date() : null, enrolledAt: input.status === "enrolled" ? new Date() : undefined },
      create: { tenantId: ctx.tenantId, employeeId: emp.id, schemeId: scheme?.id ?? null, status: input.status, enrolledAt: input.status === "enrolled" ? new Date() : null },
      select: { id: true },
    });
    revalidatePath("/admin/payroll");
    return enrolment;
  },
);

export const submitExpense = guardedAction(
  { require: { module: "expense", action: "create" }, schema: submitExpenseSchema, audit: { action: "expense.submit", entity: "ExpenseClaim" } },
  async (ctx, input) => {
    const targetId = input.employeeId && ctx.ability.can("expense", "edit") ? input.employeeId : ctx.employeeId;
    if (!targetId) throw new Error("No employee record linked to your account");
    const claim = await prisma.expenseClaim.create({
      data: {
        tenantId: ctx.tenantId,
        employeeId: targetId,
        category: input.category,
        amountPence: poundsToPence(input.amount),
        description: input.description,
        incurredOn: input.incurredOn,
        status: "pending",
      },
      select: { id: true },
    });
    revalidatePath("/me/expenses");
    revalidatePath("/admin/expenses");
    revalidatePath("/manager/approvals");
    return claim;
  },
);

export const decideExpense = guardedAction(
  { require: { module: "expense", action: "approve" }, schema: decideExpenseSchema, audit: { action: "expense.decide", entity: "ExpenseClaim" } },
  async (ctx, input) => {
    const claim = await prisma.expenseClaim.findFirst({
      where: { id: input.id, tenantId: ctx.tenantId },
      include: { employee: { select: { managerId: true } } },
    });
    if (!claim) throw new Error("Claim not found");
    const isHr = ctx.ability.can("expense", "edit");
    if (!isHr && claim.employee.managerId !== ctx.employeeId) {
      throw new Error("You can only approve claims from your direct reports");
    }
    const status = input.decision === "approve" ? "approved" : input.decision === "paid" ? "paid" : "rejected";
    const updated = await prisma.expenseClaim.update({
      where: { id: claim.id },
      data: { status, approverId: ctx.employeeId, decidedAt: new Date() },
      select: { id: true },
    });
    revalidatePath("/admin/expenses");
    revalidatePath("/manager/approvals");
    revalidatePath("/me/expenses");
    return updated;
  },
);

export const addBenefit = guardedAction(
  { require: { module: "payroll", action: "edit" }, schema: addBenefitSchema, audit: { action: "benefit.add", entity: "BenefitInKind" } },
  async (ctx, input) => {
    const emp = await prisma.employee.findFirst({ where: { id: input.employeeId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!emp) throw new Error("Employee not found");
    const benefit = await prisma.benefitInKind.create({
      data: {
        tenantId: ctx.tenantId,
        employeeId: emp.id,
        type: input.type,
        description: input.description || null,
        cashEquivalentPence: poundsToPence(input.cashEquivalent),
        taxYear: TAX_YEAR,
      },
      select: { id: true },
    });
    revalidatePath("/admin/expenses");
    return benefit;
  },
);
