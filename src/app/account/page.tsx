import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { ProfileForm, PasswordForm } from "./account-forms";

const ROLE_LABELS: Record<string, string> = {
  PLATFORM_OWNER: "Platform Owner",
  HR_ADMIN: "HR Administrator",
  MANAGER: "Line Manager",
  EMPLOYEE: "Employee",
  EXTERNAL: "External Access",
};

export const metadata = { title: "Account — CompliHR UK" };

export default async function AccountPage() {
  const ctx = await requireSession();

  const [user, employee, tenant] = await Promise.all([
    prisma.user.findUnique({ where: { id: ctx.userId }, select: { name: true, email: true, lastLoginAt: true } }),
    ctx.employeeId
      ? prisma.employee.findUnique({ where: { id: ctx.employeeId }, select: { phone: true, payrollRef: true, jobTitle: { select: { title: true } }, department: { select: { name: true } } } })
      : Promise.resolve(null),
    ctx.tenantId ? prisma.tenant.findUnique({ where: { id: ctx.tenantId }, select: { name: true } }) : Promise.resolve(null),
  ]);

  const name = user?.name ?? "";
  const email = user?.email ?? ctx.email;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Account" subtitle="Manage your profile and sign-in details" />

      {/* Identity summary */}
      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-brand/15 text-lg font-bold text-brand-dark">
              {initials(name.split(" ")[0], name.split(" ")[1])}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold">{name || email}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ctx.roles.map((r) => (
                <Badge key={r} tone="brand">{ROLE_LABELS[r] ?? r}</Badge>
              ))}
              {tenant ? <Badge tone="neutral">{tenant.name}</Badge> : null}
              {employee?.jobTitle?.title ? <Badge tone="neutral">{employee.jobTitle.title}</Badge> : null}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>Update your name and contact details. Changing your email changes how you sign in.</CardDescription>
          </CardHeader>
          <CardBody>
            <ProfileForm defaults={{ name, email, phone: employee?.phone ?? "", hasEmployee: !!ctx.employeeId }} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Choose a strong password you don&apos;t use elsewhere.</CardDescription>
          </CardHeader>
          <CardBody>
            <PasswordForm />
          </CardBody>
        </Card>

        {employee ? (
          <Card>
            <CardHeader>
              <CardTitle>Employment</CardTitle>
              <CardDescription>Managed by your HR team — contact them to request changes.</CardDescription>
            </CardHeader>
            <CardBody className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between border-b border-border py-2 sm:border-0">
                <span className="text-muted-foreground">Payroll reference</span><span className="font-medium">{employee.payrollRef ?? "—"}</span>
              </div>
              <div className="flex justify-between border-b border-border py-2 sm:border-0">
                <span className="text-muted-foreground">Department</span><span className="font-medium">{employee.department?.name ?? "—"}</span>
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
