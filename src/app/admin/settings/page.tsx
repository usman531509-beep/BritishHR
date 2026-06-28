import { LifeBuoy } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { formatDate } from "@/lib/utils";

const statusToneMap = { open: "warning", in_progress: "brand", resolved: "success", closed: "neutral" } as const;

export default async function SettingsPage() {
  const ctx = await requireTenant();
  const [tenant, tickets] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      include: { subscription: { include: { plan: true } }, _count: { select: { employees: true, users: true } } },
    }),
    prisma.supportTicket.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <>
      <PageHeader
        title="Company Settings"
        subtitle="Company profile, subscription and support"
        action={
          <FormModalLauncher
            formKey="raiseTicket"
            title="Contact support"
            description="Raise a support ticket with the CompliHR team."
            trigger={<Button><LifeBuoy className="h-4 w-4" /> Raise ticket</Button>}
          />
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle>Company</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{tenant?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Companies House</span><span className="font-medium">{tenant?.companiesHouseNo ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium">{tenant?.subscription?.plan.name ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Subscription</span><span className="font-medium">{tenant?.subscription?.status ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Employees / Users</span><span className="font-medium">{tenant?._count.employees} / {tenant?._count.users}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sponsor licence</span><span className="font-medium">{tenant?.sponsorLicenceNo ?? "—"}</span></div>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Your support tickets</CardTitle></CardHeader>
        <CardBody>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets raised.</p>
          ) : (
            <ul className="space-y-2">
              {tickets.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                    {t.resolution ? <p className="text-xs text-success">Resolution: {t.resolution}</p> : null}
                  </div>
                  <Badge tone={statusToneMap[t.status]}>{t.status.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
