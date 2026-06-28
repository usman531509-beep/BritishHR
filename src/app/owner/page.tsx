import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { platformStats, listCompanies } from "@/lib/services/platform";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { formatGBP } from "@/lib/validation/uk";

export default async function OwnerOverview() {
  await requireSession(); // PLATFORM_OWNER enforced by the area layout
  const [stats, companies] = await Promise.all([platformStats(), listCompanies()]);

  return (
    <>
      <PageHeader title="Platform Overview" subtitle="All tenants on CompliHR UK" />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Companies" value={stats.companies} />
        <StatCard label="MRR" value={formatGBP(stats.mrr)} tone="success" />
        <StatCard label="Active subscriptions" value={stats.activeSubs} />
        <StatCard label="Open tickets" value={stats.openTickets} tone={stats.openTickets ? "warning" : "success"} />
      </div>
      <Card className="mt-6 overflow-hidden">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Companies</CardTitle>
          <Link href="/owner/companies" className="text-sm font-medium text-brand hover:underline">Manage</Link>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Employees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium"><Link href={`/owner/companies/${c.id}`} className="hover:text-brand">{c.name}</Link></td>
                  <td className="px-4 py-3 text-muted-foreground">{c.subscription?.plan.name ?? "—"}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(c.status === "active" ? "active" : c.status === "trial" ? "pending" : "suspended")}>{c.status}</Badge></td>
                  <td className="px-4 py-3">{c._count.employees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </>
  );
}
