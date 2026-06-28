import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getCompany, listPlans } from "@/lib/services/platform";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { formatGBP } from "@/lib/validation/uk";
import { formatDate } from "@/lib/utils";
import { enabledFeatures } from "@/lib/features";
import { SubscriptionControl, InvoicePaidButton, GenerateInvoiceButton, FeatureToggle } from "../../owner-forms";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const [company, plans] = await Promise.all([getCompany(id), listPlans()]);
  if (!company) notFound();

  return (
    <>
      <Link href="/owner/companies" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> All companies
      </Link>
      <PageHeader title={company.name} subtitle={`Slug: ${company.slug}`} action={<Badge tone={statusTone(company.status === "active" ? "active" : company.status === "trial" ? "pending" : "suspended")}>{company.status}</Badge>} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Plan" value={company.subscription?.plan.name ?? "—"} />
        <StatCard label="Employees" value={company._count.employees} />
        <StatCard label="Users" value={company._count.users} />
      </div>

      <Card className="mb-6">
        <CardHeader className="flex items-center justify-between"><CardTitle>Subscription</CardTitle><GenerateInvoiceButton tenantId={company.id} /></CardHeader>
        <CardBody>
          {company.subscription ? (
            <SubscriptionControl tenantId={company.id} planId={company.subscription.planId} status={company.subscription.status} plans={plans} />
          ) : <p className="text-sm text-muted-foreground">No subscription.</p>}
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Optional modules</CardTitle></CardHeader>
        <CardBody>
          <FeatureToggle tenantId={company.id} flag="accounting" label="Accounting & Corporation Tax (CT600)" enabled={enabledFeatures(company.featureFlags).includes("accounting")} />
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Number</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Issued</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {company.invoices.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No invoices.</td></tr>
              ) : company.invoices.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3 font-medium">{i.number}</td>
                  <td className="px-4 py-3">{formatGBP(i.amountPence)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(i.issuedAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(i.dueAt)}</td>
                  <td className="px-4 py-3"><Badge tone={i.status === "paid" ? "success" : i.status === "overdue" ? "danger" : "warning"}>{i.status}</Badge></td>
                  <td className="px-4 py-3 text-right">{i.status !== "paid" && i.status !== "void" ? <InvoicePaidButton id={i.id} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </CardBody>
      </Card>
    </>
  );
}
