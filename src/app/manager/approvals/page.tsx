import { requireTenant } from "@/lib/auth/session";
import { pendingApprovals } from "@/lib/services/leave";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApprovalActions } from "@/components/shared/approval-actions";
import { formatDate } from "@/lib/utils";

export default async function ApprovalsPage() {
  const ctx = await requireTenant();
  // HR (leave:edit) sees all; managers see only their reports.
  const seeAll = ctx.ability.can("leave", "edit");
  const requests = await pendingApprovals(ctx.tenantId, ctx.employeeId, seeAll);

  return (
    <>
      <PageHeader
        title="Leave Approvals"
        subtitle={seeAll ? "All pending requests" : "Pending requests from your team"}
      />
      {requests.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Nothing awaiting your approval. 🎉</Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {r.employee.firstName} {r.employee.lastName}
                    <span className="ml-2 text-xs text-muted-foreground">{r.employee.department?.name ?? ""}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    <Badge tone="brand">{r.leaveType.name}</Badge>{" "}
                    {formatDate(r.startDate)} → {formatDate(r.endDate)} · <strong>{r.days} day(s)</strong>
                  </p>
                  {r.reason ? <p className="mt-1 text-xs text-muted-foreground">“{r.reason}”</p> : null}
                </div>
                <ApprovalActions id={r.id} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
