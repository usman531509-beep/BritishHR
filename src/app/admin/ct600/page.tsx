import { requireTenant } from "@/lib/auth/session";
import { requireFeature } from "@/lib/features";
import { ctComputation } from "@/lib/services/accounting";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGBP } from "@/lib/validation/uk";
import { formatDate } from "@/lib/utils";

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between py-2 text-sm ${strong ? "border-t border-border font-bold" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const rateLabel = { small: "Small profits rate (19%)", marginal: "Marginal relief", main: "Main rate (25%)" } as const;

export default async function Ct600Page() {
  const ctx = await requireTenant();
  await requireFeature(ctx.tenantId, "accounting");
  const { pl, ct, periodEnd, deadlines } = await ctComputation(ctx.tenantId);

  return (
    <>
      <PageHeader title="Corporation Tax (CT600)" subtitle="FY2024 computation derived from your accounts" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Taxable profit" value={formatGBP(ct.taxableProfit)} />
        <StatCard label="Corporation tax" value={formatGBP(ct.tax)} tone="warning" />
        <StatCard label="Effective rate" value={`${(ct.effectiveRate * 100).toFixed(2)}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Computation</CardTitle></CardHeader>
          <CardBody>
            <Line label="Turnover" value={formatGBP(pl.revenue)} />
            <Line label="Allowable expenses" value={formatGBP(pl.overheads)} />
            <Line label="Taxable profit" value={formatGBP(ct.taxableProfit)} strong />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rate applied</span>
              <Badge tone="brand">{rateLabel[ct.rate]}</Badge>
            </div>
            <Line label="Corporation tax due" value={formatGBP(ct.tax)} strong />
            <p className="mt-3 rounded-lg bg-bg/60 p-3 text-xs text-muted-foreground">
              Marginal relief applies between £50,000 and £250,000 of profit (3/200 fraction). Limits are
              reduced pro-rata for short periods and by the number of associated companies.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Key dates & filing</CardTitle></CardHeader>
          <CardBody>
            <Line label="Accounting period end" value={formatDate(periodEnd)} />
            <Line label="CT payment due" value={formatDate(deadlines.paymentDue)} />
            <Line label="CT600 filing due" value={formatDate(deadlines.filingDue)} />
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Supplementary pages (as applicable)</p>
              {["CT600A — Loans to participators", "CT600B — Controlled foreign companies", "CT600C — Group relief", "CT600L — R&D"].map((s) => (
                <div key={s} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span>{s}</span><Badge tone="neutral">Not started</Badge>
                </div>
              ))}
              <p className="mt-2 text-xs text-muted-foreground">iXBRL tagging &amp; HMRC submission are out of scope for this preparation module.</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
