import Link from "next/link";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { listVacancies, recruitmentStats } from "@/lib/services/recruitment";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";

export default async function RecruitmentPage() {
  const ctx = await requireTenant();
  const [vacancies, stats, departments] = await Promise.all([
    listVacancies(ctx.tenantId),
    recruitmentStats(ctx.tenantId),
    prisma.department.findMany({ where: { tenantId: ctx.tenantId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Recruitment"
        subtitle="Vacancies and applicant tracking"
        action={
          ctx.ability.can("recruitment", "create") ? (
            <FormModalLauncher
              formKey="newVacancy"
              formProps={{ departments }}
              title="New vacancy"
              description="Open a new role and start tracking applicants."
              className="sm:max-w-xl"
              trigger={<Button><Plus className="h-4 w-4" /> New vacancy</Button>}
            />
          ) : null
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open vacancies" value={stats.openVacancies} />
        <StatCard label="Active applicants" value={stats.activeApps} />
        <StatCard label="At offer stage" value={stats.offers} tone={stats.offers ? "warning" : "default"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vacancies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vacancies yet.</p>
        ) : (
          vacancies.map((v) => (
            <Link key={v.id} href={`/admin/recruitment/${v.id}`}>
              <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <h3 className="font-display font-bold">{v.title}</h3>
                  <Badge tone={statusTone(v.status === "open" ? "active" : v.status)}>{v.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{v.active} active · {v.hired}/{v.positions} hired</p>
                <p className="mt-1 text-xs text-muted-foreground">{v._count.applications} total applicant(s)</p>
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
