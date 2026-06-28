"use client";

import * as React from "react";
import { FormModal } from "@/components/shared/form-modal";

// All modal form components, imported client->client so they are bundled
// eagerly with THIS launcher chunk. A Server Component page only ever renders
// <FormModalLauncher/> (a single, always-resolvable client reference) and passes
// plain data — no form component is passed across the server->client boundary,
// which is what previously left a client reference `undefined` ("Element type is
// invalid") during cold navigation.
import { QuickAddForm } from "@/components/shared/quick-add-form";
import { EmployeeForm } from "@/app/admin/employees/employee-form";
import { NewVacancyForm, AddCandidateForm } from "@/app/admin/recruitment/recruitment-forms";
import { StartOnboardingForm } from "@/app/admin/onboarding/start-form";
import { AnnouncementForm } from "@/app/admin/messaging/messaging-forms";
import { RaiseTicketForm } from "@/app/admin/settings/raise-ticket-form";
import { ShiftForm } from "@/app/manager/rota/shift-form";
import { BenefitForm, ExpenseSubmitForm } from "@/app/admin/expenses/expense-forms";
import { DsarForm, RiskForm, AccidentForm } from "@/app/admin/compliance/compliance-forms";
import { RtwCheckForm, AddVisaForm, SponsorLicenceForm } from "@/app/admin/immigration/immigration-forms";
import { CreatePayRunForm } from "@/app/admin/payroll/payroll-forms";
import { CustomerForm, SupplierForm, InvoiceForm, BillForm } from "@/app/admin/financial/financial-forms";
import { ProvisionTenantForm } from "@/app/owner/owner-forms";
import { PlanForm } from "@/app/owner/plans/plan-form";
import { LeaveRequestForm } from "@/app/me/leave/leave-request-form";

type AnyForm = React.ComponentType<{ onSuccess?: () => void } & Record<string, unknown>>;

const REGISTRY = {
  quickAdd: QuickAddForm,
  employee: EmployeeForm,
  newVacancy: NewVacancyForm,
  addCandidate: AddCandidateForm,
  startOnboarding: StartOnboardingForm,
  announcement: AnnouncementForm,
  raiseTicket: RaiseTicketForm,
  shift: ShiftForm,
  benefit: BenefitForm,
  expenseSubmit: ExpenseSubmitForm,
  dsar: DsarForm,
  risk: RiskForm,
  accident: AccidentForm,
  rtwCheck: RtwCheckForm,
  addVisa: AddVisaForm,
  sponsorLicence: SponsorLicenceForm,
  createPayRun: CreatePayRunForm,
  customer: CustomerForm,
  supplier: SupplierForm,
  invoice: InvoiceForm,
  bill: BillForm,
  provisionTenant: ProvisionTenantForm,
  plan: PlanForm,
  leaveRequest: LeaveRequestForm,
} as unknown as Record<string, AnyForm>;

export type FormKey = keyof typeof REGISTRY;

export function FormModalLauncher({
  formKey,
  formProps,
  trigger,
  title,
  description,
  className,
}: {
  formKey: FormKey;
  formProps?: Record<string, unknown>;
  trigger: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  const Form = REGISTRY[formKey];
  return (
    <FormModal trigger={trigger} title={title} description={description} className={className}>
      <Form {...(formProps ?? {})} />
    </FormModal>
  );
}
