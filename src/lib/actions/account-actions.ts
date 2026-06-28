"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { getSessionContext } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/guard";
import { profileSchema, passwordSchema } from "@/lib/validation/account";

// Account actions work for ANY authenticated user (including the tenant-less
// Platform Owner), so they don't use the tenant-scoped guardedAction wrapper.

export async function updateProfile(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await getSessionContext();
  if (!ctx) return { ok: false, error: "Not authenticated" };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }
  const { name, email, phone } = parsed.data;
  const lowerEmail = email.toLowerCase();

  const clash = await prisma.user.findFirst({ where: { email: lowerEmail, NOT: { id: ctx.userId } }, select: { id: true } });
  if (clash) return { ok: false, error: "That email is already in use", fieldErrors: { email: ["Already in use"] } };

  try {
    await prisma.user.update({ where: { id: ctx.userId }, data: { name, email: lowerEmail } });
    // Keep the linked employee record's contact details in step.
    if (ctx.employeeId) {
      await prisma.employee.update({ where: { id: ctx.employeeId }, data: { email: lowerEmail, phone: phone || null } });
    }
    await prisma.auditLog.create({
      data: { tenantId: ctx.tenantId, actorId: ctx.userId, action: "account.updateProfile", entity: "User", entityId: ctx.userId },
    });
    revalidatePath("/account");
    return { ok: true, data: { id: ctx.userId } };
  } catch (err) {
    console.error("[updateProfile]", err);
    return { ok: false, error: "Could not save your changes" };
  }
}

export async function changePassword(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await getSessionContext();
  if (!ctx) return { ok: false, error: "Not authenticated" };

  const parsed = passwordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { passwordHash: true } });
  if (!user?.passwordHash) return { ok: false, error: "No password set on this account" };

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return { ok: false, error: "Current password is incorrect", fieldErrors: { currentPassword: ["Incorrect"] } };

  try {
    await prisma.user.update({ where: { id: ctx.userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
    await prisma.auditLog.create({
      data: { tenantId: ctx.tenantId, actorId: ctx.userId, action: "account.changePassword", entity: "User", entityId: ctx.userId },
    });
    return { ok: true, data: { id: ctx.userId } };
  } catch (err) {
    console.error("[changePassword]", err);
    return { ok: false, error: "Could not update your password" };
  }
}
