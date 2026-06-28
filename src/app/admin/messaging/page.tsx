import { Megaphone } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { listAnnouncements } from "@/lib/services/messaging";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { formatDate } from "@/lib/utils";

export default async function MessagingPage() {
  const ctx = await requireTenant();
  const [announcements, departments] = await Promise.all([
    listAnnouncements(ctx.tenantId),
    prisma.department.findMany({ where: { tenantId: ctx.tenantId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Messaging & Announcements"
        subtitle="Company-wide communications with read receipts"
        action={
          ctx.ability.can("messaging", "create") ? (
            <FormModalLauncher
              formKey="announcement"
              formProps={{ departments }}
              title="New announcement"
              description="Broadcast a message to your organisation."
              className="sm:max-w-xl"
              trigger={<Button><Megaphone className="h-4 w-4" /> New announcement</Button>}
            />
          ) : null
        }
      />

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No announcements yet.</Card>
        ) : announcements.map((a) => (
          <Card key={a.id}>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-bold">{a.title} {a.mandatory ? <Badge tone="warning">Mandatory</Badge> : null}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <Badge tone="brand">{a.reads} / {a.audienceSize} read</Badge>
                  <p className="mt-1">{formatDate(a.createdAt)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
