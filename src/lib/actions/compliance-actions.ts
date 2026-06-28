"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { guardedAction } from "@/lib/actions/guard";
import { encryptField } from "@/lib/crypto";
import { dsarDueDate } from "@/lib/domain/compliance";
import {
  createDsarSchema, progressDsarSchema, consentSchema, equalitySchema,
  riskAssessmentSchema, reviewRiskSchema, accidentSchema, toggleRiddorSchema,
} from "@/lib/validation/compliance";

// ── GDPR ──
export const createDsar = guardedAction(
  { require: { module: "compliance", action: "create" }, schema: createDsarSchema, audit: { action: "dsar.create", entity: "DsarRequest" } },
  async (ctx, input) => {
    const now = new Date();
    const dsar = await prisma.dsarRequest.create({
      data: {
        tenantId: ctx.tenantId,
        subjectName: input.subjectName,
        subjectEmail: input.subjectEmail || null,
        type: input.type,
        status: "received",
        receivedAt: now,
        dueAt: dsarDueDate(now),
        note: input.note || null,
      },
      select: { id: true },
    });
    revalidatePath("/admin/compliance");
    return dsar;
  },
);

export const progressDsar = guardedAction(
  { require: { module: "compliance", action: "edit" }, schema: progressDsarSchema, audit: { action: "dsar.progress", entity: "DsarRequest" } },
  async (ctx, input) => {
    const dsar = await prisma.dsarRequest.findFirst({ where: { id: input.id, tenantId: ctx.tenantId }, select: { id: true } });
    if (!dsar) throw new Error("DSAR not found");
    const updated = await prisma.dsarRequest.update({
      where: { id: dsar.id },
      data: { status: input.status, completedAt: input.status === "completed" ? new Date() : null },
      select: { id: true },
    });
    revalidatePath("/admin/compliance");
    return updated;
  },
);

export const recordConsent = guardedAction(
  { require: { module: "compliance", action: "edit" }, schema: consentSchema, audit: { action: "consent.record", entity: "ConsentRecord" } },
  async (ctx, input) => {
    const emp = await prisma.employee.findFirst({ where: { id: input.employeeId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!emp) throw new Error("Employee not found");
    const consent = await prisma.consentRecord.create({
      data: {
        tenantId: ctx.tenantId,
        employeeId: emp.id,
        purpose: input.purpose,
        lawfulBasis: input.lawfulBasis,
        granted: input.granted,
        withdrawnAt: input.granted ? null : new Date(),
      },
      select: { id: true },
    });
    revalidatePath("/admin/compliance");
    return consent;
  },
);

// ── Equality (special-category, encrypted) ── self-service or HR on behalf.
export const saveEqualityRecord = guardedAction(
  { schema: equalitySchema, audit: { action: "equality.save", entity: "EqualityRecord" } },
  async (ctx, input) => {
    const targetId =
      input.employeeId && ctx.ability.can("compliance", "edit") ? input.employeeId : ctx.employeeId;
    if (!targetId) throw new Error("No employee record linked to your account");

    const data = {
      genderEnc: encryptField(input.gender),
      ethnicityEnc: encryptField(input.ethnicity),
      disabilityEnc: encryptField(input.disability),
      religionEnc: encryptField(input.religion),
      sexualOrientationEnc: encryptField(input.sexualOrientation),
      maritalStatusEnc: encryptField(input.maritalStatus),
    };
    const rec = await prisma.equalityRecord.upsert({
      where: { employeeId: targetId },
      update: data,
      create: { tenantId: ctx.tenantId, employeeId: targetId, ...data },
      select: { id: true },
    });
    revalidatePath("/me");
    revalidatePath("/admin/compliance");
    return rec;
  },
);

// ── Health & Safety ──
export const createRiskAssessment = guardedAction(
  { require: { module: "compliance", action: "create" }, schema: riskAssessmentSchema, audit: { action: "risk.create", entity: "RiskAssessment" } },
  async (ctx, input) => {
    const ra = await prisma.riskAssessment.create({
      data: {
        tenantId: ctx.tenantId,
        title: input.title,
        area: input.area || null,
        riskLevel: input.riskLevel,
        lastReviewed: new Date(),
        nextReview: input.nextReview ?? null,
      },
      select: { id: true },
    });
    revalidatePath("/admin/compliance");
    return ra;
  },
);

export const reviewRiskAssessment = guardedAction(
  { require: { module: "compliance", action: "edit" }, schema: reviewRiskSchema, audit: { action: "risk.review", entity: "RiskAssessment" } },
  async (ctx, input) => {
    const ra = await prisma.riskAssessment.findFirst({ where: { id: input.id, tenantId: ctx.tenantId }, select: { id: true } });
    if (!ra) throw new Error("Risk assessment not found");
    const now = new Date();
    const next = new Date(now);
    next.setUTCFullYear(next.getUTCFullYear() + 1); // annual review cycle
    const updated = await prisma.riskAssessment.update({
      where: { id: ra.id },
      data: { lastReviewed: now, nextReview: next },
      select: { id: true },
    });
    revalidatePath("/admin/compliance");
    return updated;
  },
);

export const logAccident = guardedAction(
  { require: { module: "compliance", action: "create" }, schema: accidentSchema, audit: { action: "accident.log", entity: "Accident" } },
  async (ctx, input) => {
    const accident = await prisma.accident.create({
      data: {
        tenantId: ctx.tenantId,
        employeeId: input.employeeId || null,
        type: input.type,
        occurredAt: input.occurredAt,
        location: input.location || null,
        description: input.description,
        riddorReportable: input.riddorReportable,
      },
      select: { id: true },
    });
    revalidatePath("/admin/compliance");
    return accident;
  },
);

export const toggleRiddorReported = guardedAction(
  { require: { module: "compliance", action: "edit" }, schema: toggleRiddorSchema, audit: { action: "accident.riddor", entity: "Accident" } },
  async (ctx, input) => {
    const a = await prisma.accident.findFirst({ where: { id: input.id, tenantId: ctx.tenantId }, select: { id: true, reportedToHse: true } });
    if (!a) throw new Error("Incident not found");
    const updated = await prisma.accident.update({
      where: { id: a.id },
      data: { reportedToHse: !a.reportedToHse },
      select: { id: true },
    });
    revalidatePath("/admin/compliance");
    return updated;
  },
);
