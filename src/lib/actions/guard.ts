import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getSessionContext, type SessionContext } from "@/lib/auth/session";
import type { Action, Module } from "@/lib/authz/permissions";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

interface GuardOptions<TInput> {
  /** Required permission for this action. */
  require?: { module: Module; action: Action };
  /** Zod schema validating the (already-parsed) input. */
  schema?: z.ZodType<TInput>;
  /** Audit metadata; entityId may be derived after the handler runs. */
  audit?: { action: string; entity: string };
}

interface GuardContext extends SessionContext {
  /** Tenant id, guaranteed non-null inside a guarded action. */
  tenantId: string;
}

/**
 * Wraps a Server Action with the standard pipeline:
 *   authenticate → tenant scope → authorize (RBAC) → validate (Zod)
 *   → execute → audit → typed result.
 * Errors are returned as values (never thrown to the client) for clean forms.
 */
export function guardedAction<TInput, TOutput>(
  opts: GuardOptions<TInput>,
  handler: (ctx: GuardContext, input: TInput) => Promise<TOutput>,
) {
  return async (rawInput: TInput): Promise<ActionResult<TOutput>> => {
    const ctx = await getSessionContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    if (!ctx.tenantId) return { ok: false, error: "No tenant context" };

    if (opts.require && !ctx.ability.can(opts.require.module, opts.require.action)) {
      return { ok: false, error: "You do not have permission to perform this action" };
    }

    let input = rawInput;
    if (opts.schema) {
      const parsed = opts.schema.safeParse(rawInput);
      if (!parsed.success) {
        return {
          ok: false,
          error: "Validation failed",
          fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
        };
      }
      input = parsed.data;
    }

    try {
      const data = await handler({ ...ctx, tenantId: ctx.tenantId }, input);

      if (opts.audit) {
        await prisma.auditLog.create({
          data: {
            tenantId: ctx.tenantId,
            actorId: ctx.userId,
            action: opts.audit.action,
            entity: opts.audit.entity,
            entityId:
              data && typeof data === "object" && "id" in data
                ? String((data as { id: unknown }).id)
                : null,
            after: JSON.parse(JSON.stringify(data ?? null)),
          },
        });
      }

      return { ok: true, data };
    } catch (err) {
      console.error("[guardedAction]", opts.audit?.action ?? "action", err);
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  };
}

interface PlatformGuardOptions<TInput> {
  schema?: z.ZodType<TInput>;
  audit?: { action: string; entity: string };
}

/**
 * Guard for Platform Owner actions, which operate ACROSS tenants and therefore
 * have no single tenant scope. Requires the PLATFORM_OWNER role.
 */
export function platformAction<TInput, TOutput>(
  opts: PlatformGuardOptions<TInput>,
  handler: (ctx: SessionContext, input: TInput) => Promise<TOutput>,
) {
  return async (rawInput: TInput): Promise<ActionResult<TOutput>> => {
    const ctx = await getSessionContext();
    if (!ctx) return { ok: false, error: "Not authenticated" };
    if (!ctx.ability.isPlatformOwner) return { ok: false, error: "Platform owner access required" };

    let input = rawInput;
    if (opts.schema) {
      const parsed = opts.schema.safeParse(rawInput);
      if (!parsed.success) {
        return { ok: false, error: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
      }
      input = parsed.data;
    }

    try {
      const data = await handler(ctx, input);
      if (opts.audit) {
        await prisma.auditLog.create({
          data: {
            tenantId: data && typeof data === "object" && "tenantId" in data ? String((data as { tenantId: unknown }).tenantId) : null,
            actorId: ctx.userId,
            action: opts.audit.action,
            entity: opts.audit.entity,
            entityId: data && typeof data === "object" && "id" in data ? String((data as { id: unknown }).id) : null,
            after: JSON.parse(JSON.stringify(data ?? null)),
          },
        });
      }
      return { ok: true, data };
    } catch (err) {
      console.error("[platformAction]", opts.audit?.action ?? "action", err);
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  };
}
