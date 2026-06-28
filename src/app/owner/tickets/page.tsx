import { requireSession } from "@/lib/auth/session";
import { listTickets } from "@/lib/services/platform";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { TicketControl } from "../owner-forms";

const priorityTone = { urgent: "danger", high: "warning", normal: "neutral", low: "neutral" } as const;
const statusToneMap = { open: "warning", in_progress: "brand", resolved: "success", closed: "neutral" } as const;

export default async function TicketsPage() {
  await requireSession();
  const tickets = await listTickets();

  return (
    <>
      <PageHeader title="Support Tickets" subtitle="Customer support across all tenants" />
      {tickets.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No support tickets.</Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id}>
              <CardBody className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {t.subject}
                    <span className="ml-2 text-xs text-muted-foreground">{t.tenant.name}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.body}</p>
                  {t.resolution ? <p className="mt-1 text-xs text-success">Resolution: {t.resolution}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                  <Badge tone={statusToneMap[t.status]}>{t.status.replace(/_/g, " ")}</Badge>
                  <TicketControl id={t.id} status={t.status} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
