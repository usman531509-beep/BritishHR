import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { listEmployees, getOrgOptions } from "@/lib/services/employees";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, statusTone } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatGBP } from "@/lib/validation/uk";
import { initials } from "@/lib/utils";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteEmployee } from "./actions";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; departmentId?: string }>;
}) {
  const ctx = await requireTenant();
  const sp = await searchParams;
  const [employees, options] = await Promise.all([
    listEmployees(ctx.tenantId, { q: sp.q, departmentId: sp.departmentId }),
    getOrgOptions(ctx.tenantId),
  ]);

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} record${employees.length === 1 ? "" : "s"}`}
        action={
          ctx.ability.can("employee", "create") ? (
            <FormModalLauncher
              formKey="employee"
              formProps={{ options, mode: "create" }}
              title="Add employee"
              description="Create a new employee record and starting contract."
              className="sm:max-w-2xl"
              trigger={<Button><Plus className="h-4 w-4" /> Add employee</Button>}
            />
          ) : null
        }
      />

      <Card className="mb-4 p-3">
        <form className="flex flex-wrap gap-2" action="/admin/employees" method="get">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search name, email, payroll ref…"
              className="pl-9"
            />
          </div>
          <select
            name="departmentId"
            defaultValue={sp.departmentId ?? ""}
            className="rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm"
          >
            <option value="">All departments</option>
            {options.departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Employee</th>
                <th className="px-4 py-3 font-semibold">Job title</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Salary</th>
                <th className="px-4 py-3 font-semibold">RTW</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((e) => (
                  <tr key={e.id} className="hover:bg-bg/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/employees/${e.id}`} className="flex items-center gap-3 font-medium hover:text-brand">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                          {initials(e.firstName, e.lastName)}
                        </span>
                        <span>
                          {e.firstName} {e.lastName}
                          {e.payrollRef ? <span className="ml-2 text-xs text-muted-foreground">{e.payrollRef}</span> : null}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{e.jobTitle?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.department?.name ?? "—"}</td>
                    <td className="px-4 py-3">{formatGBP(e.annualSalaryPence)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(e.rightToWorkStatus)}>{e.rightToWorkStatus.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(e.status)}>{e.status.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ctx.ability.can("employee", "delete") ? (
                        <ConfirmDeleteButton
                          action={deleteEmployee}
                          id={e.id}
                          title="Remove employee?"
                          description={`Remove ${e.firstName} ${e.lastName}? Their record is archived (history is kept).`}
                          confirmLabel="Remove"
                          successMessage="Employee removed"
                        />
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
