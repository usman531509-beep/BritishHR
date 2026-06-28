"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Plane, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { recordRtwCheck, addVisa, updateSponsorLicence } from "@/lib/actions/immigration-actions";

type Emp = { id: string; firstName: string; lastName: string };

export function RtwCheckForm({ employees, onSuccess }: { employees: Emp[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await recordRtwCheck(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    toast.success("Right-to-work check recorded");
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Select name="employeeId" required defaultValue="" className="w-full">
        <option value="" disabled>Employee…</option>
        {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
      </Select>
      <Select name="checkType" defaultValue="online_share_code" className="w-full">
        <option value="online_share_code">Online share code</option>
        <option value="manual">Manual document</option>
        <option value="idsp">IDSP</option>
      </Select>
      <Select name="outcome" defaultValue="passed" className="w-full">
        <option value="passed">Passed</option>
        <option value="follow_up">Follow-up</option>
        <option value="failed">Failed</option>
      </Select>
      <Input name="followUpDate" type="date" className="w-full" title="Follow-up date (time-limited leave)" />
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Record check
      </Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}

export function AddVisaForm({ employees, onSuccess }: { employees: Emp[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("sponsored", fd.get("sponsored") ? "true" : "false");
    const res = await addVisa(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    toast.success("Visa added");
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Select name="employeeId" required defaultValue="" className="w-full">
        <option value="" disabled>Employee…</option>
        {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
      </Select>
      <Select name="type" defaultValue="skilled_worker" className="w-full">
        <option value="skilled_worker">Skilled Worker</option>
        <option value="health_care_worker">Health & Care</option>
        <option value="graduate">Graduate</option>
        <option value="student">Student</option>
        <option value="family">Family</option>
        <option value="pre_settled_status">Pre-settled</option>
        <option value="settled_status">Settled</option>
        <option value="other">Other</option>
      </Select>
      <Input name="visaNumber" placeholder="Visa/BRP no." className="w-full" />
      <Input name="expiryDate" type="date" className="w-full" title="Expiry" required />
      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <input type="checkbox" name="sponsored" /> Sponsored
      </label>
      <Input name="cosRef" placeholder="CoS ref" className="w-full" />
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plane className="h-4 w-4" />}
        Add visa
      </Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}

export function SponsorLicenceForm({
  defaults,
}: {
  defaults: { sponsorLicenceNo: string | null; sponsorLicenceRating: string | null; sponsorLicenceExpiry: Date | null };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    const res = await updateSponsorLicence(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input name="sponsorLicenceNo" placeholder="Licence number" defaultValue={defaults.sponsorLicenceNo ?? ""} className="w-full" />
      <Input name="sponsorLicenceRating" placeholder="Rating (e.g. A)" defaultValue={defaults.sponsorLicenceRating ?? ""} className="w-full" />
      <Input name="sponsorLicenceExpiry" type="date" defaultValue={defaults.sponsorLicenceExpiry ? new Date(defaults.sponsorLicenceExpiry).toISOString().slice(0, 10) : ""} className="w-full" />
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saved ? "Saved" : "Save"}
      </Button>
    </form>
  );
}
