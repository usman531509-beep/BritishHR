import { requireTenant } from "@/lib/auth/session";
import { teamTimeEntries, wtdWeekSnapshot } from "@/lib/services/attendance";
import { PageHeader } from "@/components/shared/page-header";
import { TimesheetTable, WtdPanel } from "@/components/shared/attendance-tables";

export default async function ManagerAttendancePage() {
  const ctx = await requireTenant();
  const seeAll = ctx.ability.can("attendance", "edit");
  const [rows, wtd] = await Promise.all([
    teamTimeEntries(ctx.tenantId, ctx.employeeId, seeAll),
    wtdWeekSnapshot(ctx.tenantId),
  ]);

  // Managers only see their own reports' WTD rows (rows are already report-scoped).
  const myReportIds = new Set(rows.map((r) => r.employee.id));
  const wtdRows = seeAll ? wtd : wtd.filter((w) => myReportIds.has(w.id));

  return (
    <>
      <PageHeader title="Team Attendance" subtitle="Approve timesheets and monitor working hours" />
      <div className="grid gap-6 lg:grid-cols-2">
        <TimesheetTable rows={rows} canApprove />
        <WtdPanel rows={wtdRows} />
      </div>
    </>
  );
}
