import { Plus } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { createDepartment, deleteDepartment } from "../org-actions";

export default async function DepartmentsPage() {
  const ctx = await requireTenant();
  const departments = await prisma.department.findMany({
    where: { tenantId: ctx.tenantId },
    include: { _count: { select: { employees: true } }, site: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  const canCreate = ctx.ability.can("department", "create");
  const canDelete = ctx.ability.can("department", "delete");

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Organise your workforce into departments"
        action={
          canCreate ? (
            <FormModalLauncher
              formKey="quickAdd"
              formProps={{ action: createDepartment, field: "name", placeholder: "e.g. Finance", buttonLabel: "Add department", autoFocus: true }}
              title="Add department"
              description="Create a department employees can be assigned to."
              trigger={<Button><Plus className="size-4" /> Add department</Button>}
            />
          ) : undefined
        }
      />

      {departments.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No departments yet.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <Card key={d.id} className="flex items-start justify-between gap-3 p-5">
              <div className="min-w-0">
                <h3 className="font-display font-bold">{d.name}</h3>
                <p className="text-xs text-muted-foreground">{d.site?.name ?? "No site"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge tone="brand">{d._count.employees} staff</Badge>
                {canDelete ? (
                  <ConfirmDeleteButton
                    action={deleteDepartment}
                    id={d.id}
                    title="Delete department?"
                    description={`Delete “${d.name}”? This can’t be undone.`}
                  />
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
