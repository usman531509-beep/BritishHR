import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { listAllPlans, planFeatures } from "@/lib/services/plans";
import { deletePlan } from "@/lib/actions/plan-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { formatGBP } from "@/lib/validation/uk";

export const metadata = { title: "Pricing plans — CompliHR" };

export default async function OwnerPlansPage() {
  await requireSession(); // PLATFORM_OWNER enforced by the owner layout
  const plans = await listAllPlans();

  return (
    <>
      <PageHeader
        title="Pricing plans"
        subtitle="Manage the plans shown on the public pricing page"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" target="_blank" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-dark hover:underline">
              View pricing page <ExternalLink className="size-4" />
            </Link>
            <FormModalLauncher
              formKey="plan"
              formProps={{ isNew: true }}
              title="Add a new plan"
              description="Create a pricing plan for the public pricing page."
              className="sm:max-w-2xl"
              trigger={<Button><Plus className="size-4" /> Add plan</Button>}
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <CardHeader className="flex-row items-start justify-between gap-2">
              <CardTitle className="flex flex-wrap items-center gap-2">
                {p.name}
                <span className="text-sm font-normal text-muted-foreground">{formatGBP(p.monthlyPence)}/mo</span>
              </CardTitle>
              <div className="flex shrink-0 gap-1.5">
                {p.isPopular ? <Badge tone="brand">Popular</Badge> : null}
                {p.isActive ? <Badge tone="success">Visible</Badge> : <Badge tone="neutral">Hidden</Badge>}
              </div>
            </CardHeader>
            <CardBody className="flex flex-1 flex-col gap-3">
              {p.description ? <p className="text-sm text-muted-foreground">{p.description}</p> : null}
              <ul className="flex-1 space-y-1 text-sm text-muted-foreground">
                {planFeatures(p.features).slice(0, 5).map((f, i) => (
                  <li key={i} className="flex gap-2"><span className="text-brand">✓</span> {f}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">{p._count.subscriptions} subscription(s)</p>
              <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <FormModalLauncher
                  formKey="plan"
                  formProps={{
                    defaults: {
                      id: p.id,
                      name: p.name,
                      description: p.description ?? "",
                      price: Math.round(p.monthlyPence / 100),
                      maxEmployees: p.maxEmployees,
                      features: planFeatures(p.features).join("\n"),
                      ctaText: p.ctaText,
                      isPopular: p.isPopular,
                      isActive: p.isActive,
                      sortOrder: p.sortOrder,
                      subscriptions: p._count.subscriptions,
                    },
                  }}
                  title={`Edit — ${p.name}`}
                  description="Update this plan. Changes appear on the public pricing page."
                  className="sm:max-w-2xl"
                  trigger={<Button variant="secondary" size="sm"><Pencil className="size-4" /> Edit</Button>}
                />
                {p._count.subscriptions === 0 ? (
                  <ConfirmDeleteButton
                    action={deletePlan}
                    id={p.id}
                    title={`Delete “${p.name}”?`}
                    description="This removes the plan from the pricing page. This cannot be undone."
                    successMessage="Plan deleted"
                  />
                ) : null}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
