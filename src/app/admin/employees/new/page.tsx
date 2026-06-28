import { requireTenant } from "@/lib/auth/session";
import { getOrgOptions } from "@/lib/services/employees";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeForm } from "../employee-form";

export default async function NewEmployeePage() {
  const ctx = await requireTenant();
  const options = await getOrgOptions(ctx.tenantId);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add employee" subtitle="Create a new employee record and starting contract" />
      <EmployeeForm options={options} mode="create" />
    </div>
  );
}
