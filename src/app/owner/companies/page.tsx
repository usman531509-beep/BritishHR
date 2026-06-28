import Link from "next/link";
import { Building2 } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { listCompanies, listPlans } from "@/lib/services/platform";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { formatGBP } from "@/lib/validation/uk";

export default async function CompaniesPage() {
  await requireSession();
  const [companies, plans] = await Promise.all([listCompanies(), listPlans()]);

  return (
    <>
      <PageHeader
        title="Companies"
        subtitle="All tenants on the platform"
        action={
          <FormModalLauncher
            formKey="provisionTenant"
            formProps={{ plans }}
            title="Provision a new company"
            description="Create a tenant, its first admin and a subscription."
            className="sm:max-w-xl"
            trigger={<Button><Building2 className="h-4 w-4" /> New company</Button>}
          />
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">MRR</th>
              <th className="px-4 py-3 font-semibold">Employees</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-bg/40">
                <td className="px-4 py-3 font-medium"><Link href={`/owner/companies/${c.id}`} className="hover:text-brand">{c.name}</Link></td>
                <td className="px-4 py-3 text-muted-foreground">{c.subscription?.plan.name ?? "—"}</td>
                <td className="px-4 py-3">{c.subscription ? formatGBP(c.subscription.plan.monthlyPence) : "—"}</td>
                <td className="px-4 py-3">{c._count.employees}</td>
                <td className="px-4 py-3"><Badge tone={statusTone(c.status === "active" ? "active" : c.status === "trial" ? "pending" : "suspended")}>{c.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </>
  );
}
