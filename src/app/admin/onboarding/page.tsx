import Link from "next/link";
import { Rocket } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { listChecklists, employeesWithoutChecklist } from "@/lib/services/onboarding";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { formatDate } from "@/lib/utils";

export default async function OnboardingPage() {
  const ctx = await requireTenant();
  const [checklists, available] = await Promise.all([
    listChecklists(ctx.tenantId),
    employeesWithoutChecklist(ctx.tenantId),
  ]);

  return (
    <>
      <PageHeader
        title="Onboarding"
        subtitle="New-starter checklists and progress"
        action={
          ctx.ability.can("onboarding", "create") ? (
            <FormModalLauncher
              formKey="startOnboarding"
              formProps={{ employees: available }}
              title="Start onboarding"
              description="Create a new-starter checklist for an employee."
              trigger={<Button><Rocket className="h-4 w-4" /> Start onboarding</Button>}
            />
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checklists.length === 0 ? (
          <p className="text-sm text-muted-foreground">No onboarding in progress.</p>
        ) : (
          checklists.map((c) => (
            <Link key={c.id} href={`/admin/onboarding/${c.id}`}>
              <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="font-display font-bold">{c.employee.firstName} {c.employee.lastName}</h3>
                <p className="text-xs text-muted-foreground">Started {formatDate(c.employee.startDate)}</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${c.progress}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.progress}% complete · {c.tasks.length} tasks</p>
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
