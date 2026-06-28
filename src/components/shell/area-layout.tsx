import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { homeForRoles } from "@/lib/nav";
import { enabledFeatures } from "@/lib/features";
import { AppShell } from "./app-shell";

const ROLE_LABELS: Record<string, string> = {
  PLATFORM_OWNER: "Platform Owner",
  HR_ADMIN: "HR Administrator",
  MANAGER: "Line Manager",
  EMPLOYEE: "Employee",
  EXTERNAL: "External Access",
};

// Server layout for an authenticated area. Enforces that the user holds one of
// `allowedRoles`; otherwise bounces to their own home.
export async function AreaLayout({
  area,
  allowedRoles,
  children,
}: {
  area: string;
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const ctx = await requireSession();

  if (!ctx.roles.some((r) => allowedRoles.includes(r))) {
    redirect(homeForRoles(ctx.roles));
  }

  // Read name/email live from the DB so profile edits show immediately
  // (the JWT session is only refreshed on next sign-in).
  const [tenant, user] = await Promise.all([
    ctx.tenantId
      ? prisma.tenant.findUnique({ where: { id: ctx.tenantId }, select: { name: true, featureFlags: true } })
      : Promise.resolve(null),
    prisma.user.findUnique({ where: { id: ctx.userId }, select: { name: true, email: true } }),
  ]);

  const primaryRole = ctx.roles[0] ?? "EMPLOYEE";

  return (
    <AppShell
      area={area}
      name={user?.name ?? ctx.name}
      email={user?.email ?? ctx.email}
      roleLabel={ROLE_LABELS[primaryRole] ?? primaryRole}
      tenantName={tenant?.name ?? "CompliHR Platform"}
      flags={enabledFeatures(tenant?.featureFlags)}
    >
      {children}
    </AppShell>
  );
}
