"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { guardedAction } from "@/lib/actions/guard";
import { poundsToPence } from "@/lib/validation/uk";
import { canMoveStage } from "@/lib/domain/recruitment";
import { createVacancySchema, addCandidateSchema, moveStageSchema, makeOfferSchema } from "@/lib/validation/recruitment";

export const createVacancy = guardedAction(
  { require: { module: "recruitment", action: "create" }, schema: createVacancySchema, audit: { action: "vacancy.create", entity: "Vacancy" } },
  async (ctx, input) => {
    const v = await prisma.vacancy.create({
      data: {
        tenantId: ctx.tenantId,
        title: input.title,
        departmentId: input.departmentId || null,
        positions: input.positions,
        salaryMinPence: input.salaryMin != null ? poundsToPence(input.salaryMin) : null,
        salaryMaxPence: input.salaryMax != null ? poundsToPence(input.salaryMax) : null,
        description: input.description || null,
        status: "open",
      },
      select: { id: true },
    });
    revalidatePath("/admin/recruitment");
    return v;
  },
);

export const addCandidate = guardedAction(
  { require: { module: "recruitment", action: "create" }, schema: addCandidateSchema, audit: { action: "candidate.add", entity: "Application" } },
  async (ctx, input) => {
    const vacancy = await prisma.vacancy.findFirst({ where: { id: input.vacancyId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!vacancy) throw new Error("Vacancy not found");

    const candidate = await prisma.candidate.create({
      data: {
        tenantId: ctx.tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email || null,
        phone: input.phone || null,
        source: input.source || null,
      },
      select: { id: true },
    });
    const application = await prisma.application.create({
      data: { tenantId: ctx.tenantId, vacancyId: vacancy.id, candidateId: candidate.id, stage: "applied" },
      select: { id: true },
    });
    revalidatePath(`/admin/recruitment/${vacancy.id}`);
    revalidatePath("/admin/recruitment");
    return application;
  },
);

export const moveStage = guardedAction(
  { require: { module: "recruitment", action: "edit" }, schema: moveStageSchema, audit: { action: "application.moveStage", entity: "Application" } },
  async (ctx, input) => {
    const app = await prisma.application.findFirst({
      where: { id: input.applicationId, tenantId: ctx.tenantId },
      include: { vacancy: { select: { id: true } } },
    });
    if (!app) throw new Error("Application not found");
    if (!canMoveStage(app.stage, input.toStage)) {
      throw new Error(`Cannot move from ${app.stage} to ${input.toStage}`);
    }
    const updated = await prisma.application.update({
      where: { id: app.id },
      data: { stage: input.toStage },
      select: { id: true },
    });
    revalidatePath(`/admin/recruitment/${app.vacancy.id}`);
    return updated;
  },
);

export const makeOffer = guardedAction(
  { require: { module: "recruitment", action: "edit" }, schema: makeOfferSchema, audit: { action: "offer.create", entity: "Offer" } },
  async (ctx, input) => {
    const app = await prisma.application.findFirst({
      where: { id: input.applicationId, tenantId: ctx.tenantId },
      include: { vacancy: { select: { id: true } } },
    });
    if (!app) throw new Error("Application not found");

    await prisma.offer.upsert({
      where: { applicationId: app.id },
      update: { salaryPence: poundsToPence(input.salary), startDate: input.startDate ?? null, status: "sent", sentAt: new Date() },
      create: {
        tenantId: ctx.tenantId,
        applicationId: app.id,
        salaryPence: poundsToPence(input.salary),
        startDate: input.startDate ?? null,
        status: "sent",
        sentAt: new Date(),
      },
    });
    // Advance to the offer stage if eligible.
    if (canMoveStage(app.stage, "offer")) {
      await prisma.application.update({ where: { id: app.id }, data: { stage: "offer" } });
    }
    revalidatePath(`/admin/recruitment/${app.vacancy.id}`);
    return { id: app.id };
  },
);
