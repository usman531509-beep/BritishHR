import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Mail, Phone, Shield, Trash2 } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { getEmployee, getOrgOptions } from "@/lib/services/employees";
import { decryptField, maskNiNumber } from "@/lib/crypto";
import { penceToPounds } from "@/lib/validation/uk";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteEmployee } from "../actions";
import { formatGBP } from "@/lib/validation/uk";
import { formatDate, initials } from "@/lib/utils";

function toDateInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : undefined;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant();
  const { id } = await params;
  const canEdit = ctx.ability.can("employee", "edit");
  const [e, options] = await Promise.all([
    getEmployee(ctx.tenantId, id),
    canEdit ? getOrgOptions(ctx.tenantId) : Promise.resolve(null),
  ]);
  if (!e) notFound();

  // NI number is decrypted only for users with edit rights, and shown masked.
  const ni = canEdit ? maskNiNumber(decryptField(e.niNumberEnc)) : "••• (restricted)";

  const editDefaults = {
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email ?? undefined,
    phone: e.phone ?? undefined,
    payrollRef: e.payrollRef ?? undefined,
    niNumber: canEdit ? decryptField(e.niNumberEnc) ?? undefined : undefined,
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
    <>
      <PageHeader
        title={`${e.firstName} ${e.lastName}`}
        subtitle={e.jobTitle?.title ?? "No job title"}
        action={
          canEdit && options ? (
            <>
              <FormModalLauncher
                formKey="employee"
                formProps={{ options, mode: "edit", defaults: editDefaults }}
                title={`Edit — ${e.firstName} ${e.lastName}`}
                className="sm:max-w-2xl"
                trigger={<Button variant="secondary"><Pencil className="h-4 w-4" /> Edit</Button>}
              />
              {ctx.ability.can("employee", "delete") ? (
                <ConfirmDeleteButton
                  action={deleteEmployee}
                  id={e.id}
                  title="Remove employee?"
                  description={`Remove ${e.firstName} ${e.lastName}? Their record is archived (history is kept).`}
                  confirmLabel="Remove"
                  successMessage="Employee removed"
                  trigger={<Button variant="ghost" className="text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /> Remove</Button>}
                />
              ) : null}
            </>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-2xl font-extrabold text-brand">
              {initials(e.firstName, e.lastName)}
            </span>
            <h2 className="mt-3 font-display text-lg font-bold">{e.firstName} {e.lastName}</h2>
            <p className="text-sm text-muted-foreground">{e.department?.name ?? "Unassigned"}</p>
            <div className="mt-3 flex gap-2">
              <Badge tone={statusTone(e.status)}>{e.status.replace(/_/g, " ")}</Badge>
              <Badge tone={statusTone(e.rightToWorkStatus)}>RTW: {e.rightToWorkStatus.replace(/_/g, " ")}</Badge>
            </div>
            <div className="mt-4 w-full space-y-2 text-left text-sm">
              {e.email ? (
                <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {e.email}</p>
              ) : null}
              {e.phone ? (
                <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {e.phone}</p>
              ) : null}
              <p className="flex items-center gap-2 text-muted-foreground"><Shield className="h-4 w-4" /> NI: {ni}</p>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Employment</CardTitle></CardHeader>
            <CardBody>
              <Row label="Payroll reference" value={e.payrollRef} />
              <Row label="Start date" value={formatDate(e.startDate)} />
              <Row label="Job title" value={e.jobTitle?.title} />
              <Row label="Department" value={e.department?.name} />
              <Row label="Site" value={e.site?.name} />
              <Row label="Line manager" value={e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : null} />
              <Row label="FTE" value={e.fte} />
              <Row label="Annual salary" value={formatGBP(e.annualSalaryPence)} />
              <Row label="RTW / visa expiry" value={e.rightToWorkExpiry ? formatDate(e.rightToWorkExpiry) : "—"} />
            </CardBody>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Direct reports</CardTitle></CardHeader>
              <CardBody>
                {e.reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {e.reports.map((r) => (
                      <li key={r.id}>
                        <Link href={`/admin/employees/${r.id}`} className="hover:text-brand">
                          {r.firstName} {r.lastName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Employment history</CardTitle></CardHeader>
              <CardBody>
                {e.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No history recorded</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {e.history.map((h) => (
                      <li key={h.id}>
                        <p className="font-medium">{h.detail ?? h.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(h.effectiveDate)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
