import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth/session";
import { getEmployee, getOrgOptions } from "@/lib/services/employees";
import { decryptField } from "@/lib/crypto";
import { penceToPounds } from "@/lib/validation/uk";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeForm } from "../../employee-form";

function toDateInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : undefined;
}

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant();
  const { id } = await params;
  const [e, options] = await Promise.all([getEmployee(ctx.tenantId, id), getOrgOptions(ctx.tenantId)]);
  if (!e) notFound();

  const defaults = {
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email ?? undefined,
    phone: e.phone ?? undefined,
    payrollRef: e.payrollRef ?? undefined,
    niNumber: decryptField(e.niNumberEnc) ?? undefined,
    dob: toDateInput(e.dob),
    startDate: toDateInput(e.startDate),
    status: e.status,
    fte: e.fte,
    annualSalary: e.annualSalaryPence != null ? penceToPounds(e.annualSalaryPence) : undefined,
    rightToWorkStatus: e.rightToWorkStatus,
    rightToWorkExpiry: toDateInput(e.rightToWorkExpiry),
    departmentId: e.departmentId ?? undefined,
    jobTitleId: e.jobTitleId ?? undefined,
    siteId: e.siteId ?? undefined,
    managerId: e.managerId ?? undefined,
    contractType: e.contracts[0]?.type,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit — ${e.firstName} ${e.lastName}`} />
      <EmployeeForm options={options} mode="edit" defaults={defaults} />
    </div>
  );
}
