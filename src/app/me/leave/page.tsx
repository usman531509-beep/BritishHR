import { CalendarPlus } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { getEmployeeByUser } from "@/lib/services/employees";
import { employeeLeaveBalances, listLeaveTypes, listEmployeeRequests } from "@/lib/services/leave";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { CancelButton } from "@/components/shared/cancel-button";
import { formatDate } from "@/lib/utils";

export default async function MyLeavePage() {
  const ctx = await requireTenant();
  const me = ctx.employeeId ? await getEmployeeByUser(ctx.tenantId, ctx.userId) : null;

  if (!me) {
    return (
      <>
        <PageHeader title="My Leave" />
        <Card className="p-8 text-center text-muted-foreground">No employee record is linked to your account.</Card>
      </>
    );
  }

  const [balances, leaveTypes, requests] = await Promise.all([
    employeeLeaveBalances(ctx.tenantId, me.id),
    listLeaveTypes(ctx.tenantId),
    listEmployeeRequests(ctx.tenantId, me.id),
  ]);

  return (
    <>
      <PageHeader
        title="My Leave"
        subtitle="Book time off and track your balance"
        action={
          <FormModalLauncher
            formKey="leaveRequest"
            formProps={{ leaveTypes }}
            title="Request leave"
            description="Book time off — it goes to your manager for approval."
            trigger={<Button><CalendarPlus className="h-4 w-4" /> Request leave</Button>}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {balances.length === 0 ? (
          <Card className="p-5 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            No leave entitlement set up yet. Your HR team can configure this.
          </Card>
        ) : (
          balances.map((b) => (
            <Card key={b.leaveType.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{b.leaveType.name}</p>
                <span className="h-3 w-3 rounded-full" style={{ background: b.leaveType.colour }} />
              </div>
              <p className="mt-2 font-display text-3xl font-extrabold text-brand">{b.remaining}</p>
              <p className="text-xs text-muted-foreground">days remaining of {b.entitlement}</p>
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                <span>Taken {b.taken}</span>
                <span>Pending {b.booked}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="mt-6 grid gap-6">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>My requests</CardTitle></CardHeader>
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Dates</th>
                  <th className="px-4 py-3 font-semibold">Days</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No leave requests yet.</td></tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-medium">{r.leaveType.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(r.startDate)} → {formatDate(r.endDate)}</td>
                      <td className="px-4 py-3">{r.days}</td>
                      <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        {r.status === "pending" || r.status === "draft" ? <CancelButton id={r.id} /> : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
