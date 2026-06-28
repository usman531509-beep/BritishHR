import { Plus } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { createJobTitle, deleteJobTitle } from "../org-actions";

export default async function JobTitlesPage() {
  const ctx = await requireTenant();
  const titles = await prisma.jobTitle.findMany({
    where: { tenantId: ctx.tenantId },
    include: { _count: { select: { employees: true } } },
    orderBy: { title: "asc" },
  });
  const canCreate = ctx.ability.can("jobtitle", "create");
  const canDelete = ctx.ability.can("jobtitle", "delete");

  return (
    <>
      <PageHeader
        title="Job Titles"
        subtitle="Define roles used across employee records"
        action={
          canCreate ? (
            <FormModalLauncher
              formKey="quickAdd"
              formProps={{ action: createJobTitle, field: "title", placeholder: "e.g. Finance Manager", buttonLabel: "Add title", autoFocus: true }}
              title="Add job title"
              description="Create a role used on employee records."
              trigger={<Button><Plus className="size-4" /> Add job title</Button>}
            />
          ) : undefined
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Job title</th>
                <th className="px-4 py-3 font-semibold">Employees</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {titles.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3"><Badge tone="brand">{t._count.employees}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {canDelete ? (
                      <ConfirmDeleteButton
                        action={deleteJobTitle}
                        id={t.id}
                        title="Delete job title?"
                        description={`Delete “${t.title}”? This can’t be undone.`}
                      />
                    ) : null}
                  </td>
                </tr>
              ))}
              {titles.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">No job titles yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
