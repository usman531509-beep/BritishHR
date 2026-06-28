import { requireTenant } from "@/lib/auth/session";
import { immigrationData } from "@/lib/services/compliance";
import { daysUntil, expirySeverity } from "@/lib/domain/compliance";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ImmigrationHeaderActions } from "./header-actions";

const sevTone = { critical: "danger", warning: "warning", info: "neutral" } as const;

export default async function ImmigrationPage() {
  const ctx = await requireTenant();
  const { employees, tenant, sponsoredCount } = await immigrationData(ctx.tenantId);
  const canEdit = ctx.ability.can("immigration", "edit");
  const empOptions = employees.map((e) => ({ id: e.id, firstName: e.firstName, lastName: e.lastName }));

  return (
    <>
      <PageHeader
        title="Immigration & Right-to-Work"
        subtitle="Visa tracking, RTW checks and sponsor compliance"
        action={
          canEdit ? (
            <ImmigrationHeaderActions
              employees={empOptions}
              sponsor={{ sponsorLicenceNo: tenant?.sponsorLicenceNo ?? null, sponsorLicenceRating: tenant?.sponsorLicenceRating ?? null, sponsorLicenceExpiry: tenant?.sponsorLicenceExpiry ?? null }}
            />
          ) : null
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Employees" value={employees.length} />
        <StatCard label="Sponsored workers" value={sponsoredCount} />
        <StatCard
          label="Sponsor licence"
          value={tenant?.sponsorLicenceNo ? tenant.sponsorLicenceRating ?? "Held" : "—"}
          tone={tenant?.sponsorLicenceNo ? "success" : "default"}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Right-to-Work register</CardTitle></CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">RTW status</th>
                  <th className="px-4 py-3 font-semibold">Last check</th>
                  <th className="px-4 py-3 font-semibold">Visa</th>
                  <th className="px-4 py-3 font-semibold">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((e) => {
                  const visa = e.visas[0];
                  const expiry = visa?.expiryDate ?? e.rightToWorkExpiry;
                  const d = expiry ? daysUntil(expiry) : null;
                  return (
                    <tr key={e.id}>
                      <td className="px-4 py-3 font-medium">{e.firstName} {e.lastName}</td>
                      <td className="px-4 py-3"><Badge tone={statusTone(e.rightToWorkStatus)}>{e.rightToWorkStatus.replace(/_/g, " ")}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{e.rtwChecks[0] ? formatDate(e.rtwChecks[0].checkedAt) : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{visa ? visa.type.replace(/_/g, " ") + (visa.sponsored ? " (sponsored)" : "") : "—"}</td>
                      <td className="px-4 py-3">
                        {expiry ? (
                          <Badge tone={sevTone[expirySeverity(d!)]}>{formatDate(expiry)}{d! < 0 ? " · expired" : d! <= 60 ? ` · ${d}d` : ""}</Badge>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
