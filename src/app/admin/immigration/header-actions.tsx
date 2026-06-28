"use client";

import { ShieldCheck, Plane, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/shared/form-modal";
import { RtwCheckForm, AddVisaForm, SponsorLicenceForm } from "./immigration-forms";

type Emp = { id: string; firstName: string; lastName: string };

export function ImmigrationHeaderActions({
  employees,
  sponsor,
}: {
  employees: Emp[];
  sponsor: { sponsorLicenceNo: string | null; sponsorLicenceRating: string | null; sponsorLicenceExpiry: Date | null };
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <FormModal
        title="Record Right-to-Work check"
        description="Log a right-to-work verification and any follow-up date."
        className="sm:max-w-xl"
        trigger={<Button size="sm"><ShieldCheck className="h-4 w-4" /> Record check</Button>}
      >
        <RtwCheckForm employees={employees} />
      </FormModal>
      <FormModal
        title="Add visa"
        description="Record a visa or immigration status for an employee."
        className="sm:max-w-xl"
        trigger={<Button size="sm" variant="secondary"><Plane className="h-4 w-4" /> Add visa</Button>}
      >
        <AddVisaForm employees={employees} />
      </FormModal>
      <FormModal
        title="Sponsor licence (Home Office)"
        description="Maintain your organisation's sponsor licence details."
        trigger={<Button size="sm" variant="secondary"><FileText className="h-4 w-4" /> Sponsor licence</Button>}
      >
        <SponsorLicenceForm defaults={sponsor} />
      </FormModal>
    </div>
  );
}
