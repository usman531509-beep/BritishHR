import { requireSession } from "@/lib/auth/session";
import { listSubscriptions, platformStats } from "@/lib/services/platform";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { formatGBP } from "@/lib/validation/uk";

export default async function SubscriptionsPage() {
  await requireSession();
  const [subs, stats] = await Promise.all([listSubscriptions(), platformStats()]);
  const outstanding = subs.reduce((s, x) => s + x.outstanding, 0);

  return (
    <>
      <PageHeader title="Subscriptions & Billing" subtitle="Recurring revenue across the platform" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="MRR" value={formatGBP(stats.mrr)} tone="success" />
        <StatCard label="Active subscriptions" value={stats.activeSubs} />
        <StatCard label="Outstanding" value={formatGBP(outstanding)} tone={outstanding ? "warning" : "default"} />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Monthly</th>
              <th className="px-4 py-3 font-semibold">Outstanding</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium">{s.tenant.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.plan.name}</td>
                <td className="px-4 py-3">{formatGBP(s.plan.monthlyPence)}</td>
                <td className="px-4 py-3">{s.outstanding ? formatGBP(s.outstanding) : "—"}</td>
                <td className="px-4 py-3"><Badge tone={statusTone(s.status === "active" ? "active" : s.status === "trialing" ? "pending" : "suspended")}>{s.status.replace(/_/g, " ")}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </>
  );
}
