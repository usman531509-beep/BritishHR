"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { guardedAction } from "@/lib/actions/guard";
import { encryptField } from "@/lib/crypto";
import { recordRtwSchema, addVisaSchema, sponsorLicenceSchema } from "@/lib/validation/compliance";

export const recordRtwCheck = guardedAction(
  { require: { module: "immigration", action: "edit" }, schema: recordRtwSchema, audit: { action: "rtw.check", entity: "RightToWorkCheck" } },
  async (ctx, input) => {
    const emp = await prisma.employee.findFirst({ where: { id: input.employeeId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!emp) throw new Error("Employee not found");

    const check = await prisma.rightToWorkCheck.create({
      data: {
        tenantId: ctx.tenantId,
        employeeId: emp.id,
        checkType: input.checkType,
        documentType: input.documentType || null,
        outcome: input.outcome,
        followUpDate: input.followUpDate ?? null,
        checkedById: ctx.userId,
        note: input.note || null,
      },
      select: { id: true },
    });

    // Reflect the outcome on the employee's RTW status.
    const rtwStatus =
      input.outcome === "passed" ? "verified" : input.outcome === "follow_up" ? "follow_up_due" : "expired";
    await prisma.employee.update({
      where: { id: emp.id },
      data: { rightToWorkStatus: rtwStatus, ...(input.followUpDate ? { rightToWorkExpiry: input.followUpDate } : {}) },
    });

    revalidatePath("/admin/immigration");
    revalidatePath("/admin/compliance");
    return check;
  },
);

export const addVisa = guardedAction(
  { require: { module: "immigration", action: "edit" }, schema: addVisaSchema, audit: { action: "visa.add", entity: "Visa" } },
  async (ctx, input) => {
    const emp = await prisma.employee.findFirst({ where: { id: input.employeeId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!emp) throw new Error("Employee not found");

    const visa = await prisma.visa.create({
      data: {
        tenantId: ctx.tenantId,
        employeeId: emp.id,
        type: input.type,
        visaNumberEnc: input.visaNumber ? encryptField(input.visaNumber) : null,
        sponsored: input.sponsored,
        cosRef: input.cosRef || null,
        issueDate: input.issueDate ?? null,
        expiryDate: input.expiryDate ?? null,
      },
      select: { id: true },
    });
    // Keep the employee RTW expiry aligned with the visa expiry.
    if (input.expiryDate) {
      await prisma.employee.update({ where: { id: emp.id }, data: { rightToWorkExpiry: input.expiryDate } });
    }
    revalidatePath("/admin/immigration");
    return visa;
  },
);

export const updateSponsorLicence = guardedAction(
  { require: { module: "immigration", action: "edit" }, schema: sponsorLicenceSchema, audit: { action: "sponsor.update", entity: "Tenant" } },
  async (ctx, input) => {
    await prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        sponsorLicenceNo: input.sponsorLicenceNo || null,
        sponsorLicenceRating: input.sponsorLicenceRating || null,
        sponsorLicenceExpiry: input.sponsorLicenceExpiry ?? null,
      },
    });
    revalidatePath("/admin/immigration");
    return { id: ctx.tenantId };
  },
);
