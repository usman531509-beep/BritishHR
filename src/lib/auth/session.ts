import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createAbility, type Ability } from "@/lib/authz/ability";

export interface SessionContext {
  userId: string;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
  employeeId: string | null;
  ability: Ability;
  email: string;
  name: string | null;
}

/** Returns the session context or null (no throw). */
export async function getSessionContext(): Promise<SessionContext | null> {
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user;
  return {
    userId: u.id,
    tenantId: u.tenantId,
    roles: u.roles,
    permissions: u.permissions,
    employeeId: u.employeeId,
    ability: createAbility(u.permissions, u.roles),
    email: u.email ?? "",
    name: u.name ?? null,
  };
}

/** Requires an authenticated session; redirects to /login otherwise. */
export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/** Requires a tenant-scoped session (non platform-owner). */
export async function requireTenant(): Promise<SessionContext & { tenantId: string }> {
  const ctx = await requireSession();
  if (!ctx.tenantId) redirect("/owner");
  return ctx as SessionContext & { tenantId: string };
}
