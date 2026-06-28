import { requireTenant } from "@/lib/auth/session";
import { teamTimeEntries, wtdWeekSnapshot, pendingTimeEntryCount } from "@/lib/services/attendance";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { TimesheetTable, WtdPanel } from "@/components/shared/attendance-tables";

export default async function AdminAttendancePage() {
  const ctx = await requireTenant();
  const [rows, wtd, pending] = await Promise.all([
    teamTimeEntries(ctx.tenantId, null, true),
    wtdWeekSnapshot(ctx.tenantId),
    pendingTimeEntryCount(ctx.tenantId),
  ]);
  const breaches = wtd.filter((w) => w.breaches48).length;

  return (
    <>
      <PageHeader title="Attendance & Rota" subtitle="Timesheets, approvals and Working Time compliance" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Entries this week" value={rows.length} />
        <StatCard label="Awaiting approval" value={pending} tone={pending ? "warning" : "success"} />
        <StatCard label="WTD breaches" value={breaches} tone={breaches ? "danger" : "success"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <TimesheetTable rows={rows} canApprove />
        <WtdPanel rows={wtd} />
      </div>
    </>
  );
}
