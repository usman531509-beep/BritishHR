import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { getChecklist } from "@/lib/services/onboarding";
import { checklistProgress } from "@/lib/domain/onboarding";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { OnboardingTaskRow } from "@/components/shared/onboarding-task";

export default async function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant();
  const { id } = await params;
  const c = await getChecklist(ctx.tenantId, id);
  if (!c) notFound();

  const progress = checklistProgress(c.tasks);
  const canEdit = ctx.ability.can("onboarding", "edit");

  return (
    <>
      <Link href="/admin/onboarding" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> All checklists
      </Link>
      <PageHeader title={`${c.employee.firstName} ${c.employee.lastName} — Onboarding`} subtitle={`${progress}% complete`} />
      <Card>
        <CardBody>
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-bg">
            <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
          </div>
          <ul>
            {c.tasks.map((t) => (
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
