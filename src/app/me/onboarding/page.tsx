import { requireTenant } from "@/lib/auth/session";
import { myChecklist } from "@/lib/services/onboarding";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { OnboardingTaskRow } from "@/components/shared/onboarding-task";

export default async function MyOnboardingPage() {
  const ctx = await requireTenant();
  const checklist = ctx.employeeId ? await myChecklist(ctx.tenantId, ctx.employeeId) : null;

  if (!checklist) {
    return (
      <>
        <PageHeader title="My Onboarding" />
        <Card className="p-8 text-center text-muted-foreground">You have no onboarding checklist assigned.</Card>
      </>
    );
  }

  // Employees can tick off their own tasks.
  const canEdit = ctx.ability.can("onboarding", "edit");

  return (
    <>
      <PageHeader title="My Onboarding" subtitle={`${checklist.progress}% complete`} />
      <Card>
        <CardBody>
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-bg">
            <div className="h-full rounded-full bg-brand" style={{ width: `${checklist.progress}%` }} />
          </div>
          <ul>
            {checklist.tasks.map((t) => (
              <OnboardingTaskRow
                key={t.id}
                id={t.id}
                title={t.title}
                category={t.category}
                status={t.status}
                dueDate={t.dueDate}
                interactive={canEdit}
              />
            ))}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
