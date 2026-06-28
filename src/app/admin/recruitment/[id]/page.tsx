import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { getVacancy } from "@/lib/services/recruitment";
import { PageHeader } from "@/components/shared/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { formatGBP } from "@/lib/validation/uk";
import { PipelineBoard } from "../pipeline-board";

export default async function VacancyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant();
  const { id } = await params;
  const vacancy = await getVacancy(ctx.tenantId, id);
  if (!vacancy) notFound();

  return (
    <>
      <Link href="/admin/recruitment" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> All vacancies
      </Link>
      <PageHeader
        title={vacancy.title}
        subtitle={`${vacancy.positions} position(s) · ${formatGBP(vacancy.salaryMinPence)} – ${formatGBP(vacancy.salaryMaxPence)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(vacancy.status === "open" ? "active" : vacancy.status)}>{vacancy.status}</Badge>
            {ctx.ability.can("recruitment", "create") ? (
              <FormModalLauncher
                formKey="addCandidate"
                formProps={{ vacancyId: vacancy.id }}
                title="Add candidate"
                description="Add an applicant to this vacancy's pipeline."
                className="sm:max-w-xl"
                trigger={<Button size="sm"><UserPlus className="h-4 w-4" /> Add candidate</Button>}
              />
            ) : null}
          </div>
        }
      />

      <h2 className="mb-3 font-display text-lg font-bold">Pipeline</h2>
      <PipelineBoard
        applications={vacancy.applications.map((a) => ({
          id: a.id,
          stage: a.stage,
          candidate: { firstName: a.candidate.firstName, lastName: a.candidate.lastName, email: a.candidate.email, source: a.candidate.source },
          offer: a.offer ? { salaryPence: a.offer.salaryPence, status: a.offer.status } : null,
        }))}
      />
    </>
  );
}
