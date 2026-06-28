import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { TimeApproveActions } from "./time-approve-actions";
import { formatDate } from "@/lib/utils";
import { WTD_WEEKLY_LIMIT } from "@/lib/domain/attendance";

export interface TimesheetRow {
  id: string;
  date: Date;
  clockIn: Date;
  clockOut: Date | null;
  breakMinutes: number;
  status: string;
  hours: number;
  employee?: { firstName: string; lastName: string };
}

function fmtTime(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(d));
}

export function TimesheetTable({ rows, canApprove }: { rows: TimesheetRow[]; canApprove: boolean }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader><CardTitle>Timesheets — this week</CardTitle></CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                {rows[0]?.employee ? <th className="px-4 py-3 font-semibold">Employee</th> : null}
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">In</th>
                <th className="px-4 py-3 font-semibold">Out</th>
                <th className="px-4 py-3 font-semibold">Hours</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {canApprove ? <th className="px-4 py-3"></th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No entries this week.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    {r.employee ? <td className="px-4 py-3 font-medium">{r.employee.firstName} {r.employee.lastName}</td> : null}
                    <td className="px-4 py-3">{formatDate(r.date)}</td>
                    <td className="px-4 py-3">{fmtTime(r.clockIn)}</td>
                    <td className="px-4 py-3">{fmtTime(r.clockOut)}</td>
                    <td className="px-4 py-3 font-medium">{r.hours || "—"}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                    {canApprove ? (
                      <td className="px-4 py-3 text-right">
                        {r.status === "submitted" ? <TimeApproveActions id={r.id} /> : null}
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

export function WtdPanel({ rows }: { rows: { id: string; name: string; hours: number; breaches48: boolean }[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader><CardTitle>Working Time Directive — this week</CardTitle></CardHeader>
      <CardBody className="p-0">
        <p className="px-4 pt-3 text-xs text-muted-foreground">Flags employees exceeding the {WTD_WEEKLY_LIMIT}h weekly average limit.</p>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Hours</th>
              <th className="px-4 py-3 font-semibold">WTD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No completed hours logged this week.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{r.hours}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.breaches48 ? "danger" : "success"}>{r.breaches48 ? "Over 48h" : "OK"}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
