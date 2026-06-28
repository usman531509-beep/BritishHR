import { requireTenant } from "@/lib/auth/session";
import { getEmployeeByUser } from "@/lib/services/employees";
import { openEntry, myTimeEntries, myWeekHours } from "@/lib/services/attendance";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { ClockWidget } from "./clock-widget";
import { formatDate } from "@/lib/utils";

export default async function MyTimesheetPage() {
  const ctx = await requireTenant();
  const me = ctx.employeeId ? await getEmployeeByUser(ctx.tenantId, ctx.userId) : null;
  if (!me) {
    return (
      <>
        <PageHeader title="My Timesheet" />
        <Card className="p-8 text-center text-muted-foreground">No employee record is linked to your account.</Card>
      </>
    );
  }

  const [open, entries, weekTotal] = await Promise.all([
    openEntry(ctx.tenantId, me.id),
    myTimeEntries(ctx.tenantId, me.id),
    myWeekHours(ctx.tenantId, me.id),
  ]);

  return (
    <>
      <PageHeader title="My Timesheet" subtitle="Clock in and out, review your worked hours" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <ClockWidget openSince={open ? open.clockIn.toISOString() : null} />
          <Card className="p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Hours this week</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-brand">{weekTotal}</p>
          </Card>
        </div>

        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader><CardTitle>Recent entries</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">In</th>
                  <th className="px-4 py-3 font-semibold">Out</th>
                  <th className="px-4 py-3 font-semibold">Break</th>
                  <th className="px-4 py-3 font-semibold">Hours</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No time entries yet — clock in to start.</td></tr>
                ) : (
                  entries.map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-3">{formatDate(e.date)}</td>
                      <td className="px-4 py-3">{fmtTime(e.clockIn)}</td>
                      <td className="px-4 py-3">{e.clockOut ? fmtTime(e.clockOut) : "—"}</td>
                      <td className="px-4 py-3">{e.breakMinutes}m</td>
                      <td className="px-4 py-3 font-medium">{e.hours || "—"}</td>
                      <td className="px-4 py-3"><Badge tone={statusTone(e.status)}>{e.status}</Badge></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table></div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(d));
}
