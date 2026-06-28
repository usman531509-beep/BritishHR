import { requireTenant } from "@/lib/auth/session";
import { getEmployeeByUser } from "@/lib/services/employees";
import { announcementsForEmployee } from "@/lib/services/messaging";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { AnnouncementAck } from "@/components/shared/announcement-ack";
import { formatGBP } from "@/lib/validation/uk";
import { formatDate, initials } from "@/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default async function MyProfilePage() {
  const ctx = await requireTenant();
  const me = ctx.employeeId ? await getEmployeeByUser(ctx.tenantId, ctx.userId) : null;
  const announcements = me ? await announcementsForEmployee(ctx.tenantId, me.id, me.departmentId) : [];

  if (!me) {
    return (
      <>
        <PageHeader title="My Profile" />
        <Card className="p-8 text-center text-muted-foreground">
          No employee record is linked to your account yet. Ask your HR administrator to link it.
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your personal and employment details" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-2xl font-extrabold text-brand">
              {initials(me.firstName, me.lastName)}
            </span>
            <h2 className="mt-3 font-display text-lg font-bold">{me.firstName} {me.lastName}</h2>
            <p className="text-sm text-muted-foreground">{me.jobTitle?.title ?? "—"}</p>
            <Badge tone={statusTone(me.status)} className="mt-3">{me.status.replace(/_/g, " ")}</Badge>
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Employment</CardTitle></CardHeader>
          <CardBody>
            <Row label="Payroll reference" value={me.payrollRef} />
            <Row label="Department" value={me.department?.name} />
            <Row label="Start date" value={formatDate(me.startDate)} />
            <Row label="Line manager" value={me.manager ? `${me.manager.firstName} ${me.manager.lastName}` : null} />
            <Row label="Annual salary" value={formatGBP(me.annualSalaryPence)} />
            <Row label="Right-to-Work" value={<Badge tone={statusTone(me.rightToWorkStatus)}>{me.rightToWorkStatus.replace(/_/g, " ")}</Badge>} />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Announcements</CardTitle></CardHeader>
        <CardBody>
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements.</p>
          ) : (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold">
                      {a.title} {a.mandatory ? <Badge tone="warning">Mandatory</Badge> : null}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{a.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>
                  </div>
                  <AnnouncementAck announcementId={a.id} acknowledged={a.acknowledged} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
