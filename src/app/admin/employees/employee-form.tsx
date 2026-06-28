"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { createEmployee, updateEmployee } from "./actions";

type Options = {
  departments: { id: string; name: string }[];
  jobTitles: { id: string; title: string }[];
  sites: { id: string; name: string }[];
  managers: { id: string; firstName: string; lastName: string }[];
};

type Defaults = Partial<{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  payrollRef: string;
  niNumber: string;
  dob: string;
  startDate: string;
  status: string;
  contractType: string;
  fte: number;
  annualSalary: number;
  rightToWorkStatus: string;
  rightToWorkExpiry: string;
  departmentId: string;
  jobTitleId: string;
  siteId: string;
  managerId: string;
}>;

const EMPLOYMENT_STATUS = ["onboarding", "active", "on_leave", "suspended", "offboarding", "left"];
const CONTRACT_TYPES = ["permanent", "fixed_term", "part_time", "zero_hours", "apprenticeship", "contractor", "intern"];
const RTW_STATUS = ["pending", "verified", "follow_up_due", "expired", "not_required"];

export function EmployeeForm({
  options,
  defaults = {},
  mode,
  onSuccess,
}: {
  options: Options;
  defaults?: Defaults;
  mode: "create" | "edit";
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
    const input = {
      ...raw,
      fte: raw.fte ? Number(raw.fte) : 1,
      annualSalary: raw.annualSalary ? Number(raw.annualSalary) : undefined,
    };

    const res =
      mode === "create"
        ? await createEmployee(input as never)
        : await updateEmployee({ ...input, id: defaults.id } as never);

    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      return;
    }
    const id = (res.data as { id: string }).id;
    toast.success(mode === "create" ? "Employee created" : "Employee updated");
    if (onSuccess) {
      onSuccess();
      router.refresh();
    } else {
      router.push(`/admin/employees/${id}`);
      router.refresh();
    }
  }

  const err = (k: string) => fieldErrors[k]?.[0];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Personal details</CardTitle></CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={err("firstName")}>
            <Input name="firstName" defaultValue={defaults.firstName} required />
          </Field>
          <Field label="Last name" error={err("lastName")}>
            <Input name="lastName" defaultValue={defaults.lastName} required />
          </Field>
          <Field label="Email" error={err("email")}>
            <Input name="email" type="email" defaultValue={defaults.email} />
          </Field>
          <Field label="Phone" error={err("phone")}>
            <Input name="phone" defaultValue={defaults.phone} />
          </Field>
          <Field label="Date of birth" error={err("dob")}>
            <Input name="dob" type="date" defaultValue={defaults.dob} />
          </Field>
          <Field label="National Insurance no." error={err("niNumber")}>
            <Input name="niNumber" placeholder="QQ123456C" defaultValue={defaults.niNumber} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Employment</CardTitle></CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Payroll reference" error={err("payrollRef")}>
            <Input name="payrollRef" defaultValue={defaults.payrollRef} placeholder="EMP-005" />
          </Field>
          <Field label="Start date" error={err("startDate")}>
            <Input name="startDate" type="date" defaultValue={defaults.startDate} required />
          </Field>
          <Field label="Employment status" error={err("status")}>
            <Select name="status" defaultValue={defaults.status ?? "onboarding"}>
              {EMPLOYMENT_STATUS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </Select>
          </Field>
          <Field label="Contract type" error={err("contractType")}>
            <Select name="contractType" defaultValue={defaults.contractType ?? "permanent"}>
              {CONTRACT_TYPES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </Select>
          </Field>
          <Field label="FTE (0.01–1.0)" error={err("fte")}>
            <Input name="fte" type="number" step="0.01" min="0.01" max="1" defaultValue={defaults.fte ?? 1} />
          </Field>
          <Field label="Annual salary (£)" error={err("annualSalary")}>
            <Input name="annualSalary" type="number" step="0.01" min="0" defaultValue={defaults.annualSalary} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Organisation & Right-to-Work</CardTitle></CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Department" error={err("departmentId")}>
            <Select name="departmentId" defaultValue={defaults.departmentId ?? ""}>
              <option value="">—</option>
              {options.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Job title" error={err("jobTitleId")}>
            <Select name="jobTitleId" defaultValue={defaults.jobTitleId ?? ""}>
              <option value="">—</option>
              {options.jobTitles.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </Select>
          </Field>
          <Field label="Site" error={err("siteId")}>
            <Select name="siteId" defaultValue={defaults.siteId ?? ""}>
              <option value="">—</option>
              {options.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Line manager" error={err("managerId")}>
            <Select name="managerId" defaultValue={defaults.managerId ?? ""}>
              <option value="">—</option>
              {options.managers
                .filter((m) => m.id !== defaults.id)
                .map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
            </Select>
          </Field>
          <Field label="Right-to-Work status" error={err("rightToWorkStatus")}>
            <Select name="rightToWorkStatus" defaultValue={defaults.rightToWorkStatus ?? "pending"}>
              {RTW_STATUS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </Select>
          </Field>
          <Field label="RTW / visa expiry" error={err("rightToWorkExpiry")}>
            <Input name="rightToWorkExpiry" type="date" defaultValue={defaults.rightToWorkExpiry} />
          </Field>
        </CardBody>
      </Card>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => (onSuccess ? onSuccess() : router.back())}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "create" ? "Create employee" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
