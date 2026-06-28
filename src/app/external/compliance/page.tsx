import { requireTenant } from "@/lib/auth/session";
import { buildComplianceAlerts } from "@/lib/services/compliance";
import { scoreBand } from "@/lib/domain/compliance";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sevTone = { critical: "danger", warning: "warning", info: "neutral" } as const;

export default async function ExternalCompliancePage() {
  const ctx = await requireTenant();
  const { alerts, score, failing, warning } = await buildComplianceAlerts(ctx.tenantId);
  const band = scoreBand(score);

  return (
    <>
      <PageHeader title="Compliance (read-only)" subtitle="Compliance posture for your client" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Compliance score" value={`${score}%`} tone={band === "info" ? "success" : band === "warning" ? "warning" : "danger"} />
        <StatCard label="Critical issues" value={failing} tone={failing ? "danger" : "success"} />
        <StatCard label="Warnings" value={warning} tone={warning ? "warning" : "success"} />
      </div>
      <Card>
        <CardHeader><CardTitle>Active alerts</CardTitle></CardHeader>
        <CardBody>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No compliance alerts.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <Badge tone={sevTone[a.severity]}>{a.category.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
