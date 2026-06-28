import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { homeForRoles } from "@/lib/nav";
import { enabledFeatures } from "@/lib/features";
import { AppShell } from "@/components/shell/app-shell";

const ROLE_LABELS: Record<string, string> = {
  PLATFORM_OWNER: "Platform Owner",
  HR_ADMIN: "HR Administrator",
  MANAGER: "Line Manager",
  EMPLOYEE: "Employee",
  EXTERNAL: "External Access",
};

// The account page is shared by every role; render it inside the shell of the
// user's primary portal so navigation stays consistent.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSession();
  const area = homeForRoles(ctx.roles).replace("/", "") || "me";

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
