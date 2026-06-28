"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { createVacancy, addCandidate } from "@/lib/actions/recruitment-actions";

export function NewVacancyForm({ departments, onSuccess }: { departments: { id: string; name: string }[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createVacancy(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Job title"><Input name="title" required placeholder="e.g. Workshop Technician" /></Field>
      <Field label="Department">
        <Select name="departmentId" defaultValue="">
          <option value="">—</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </Field>
      <Field label="Positions"><Input name="positions" type="number" min="1" defaultValue="1" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Salary min (£)"><Input name="salaryMin" type="number" min="0" /></Field>
        <Field label="Salary max (£)"><Input name="salaryMax" type="number" min="0" /></Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Description"><Input name="description" placeholder="Short summary" /></Field>
      </div>
      {error ? <p className="text-sm text-danger sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create vacancy
        </Button>
      </div>
    </form>
  );
}

export function AddCandidateForm({ vacancyId, onSuccess }: { vacancyId: string; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("vacancyId", vacancyId);
    const res = await addCandidate(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input name="firstName" placeholder="First name" required className="w-full" />
      <Input name="lastName" placeholder="Last name" required className="w-full" />
      <Input name="email" type="email" placeholder="Email" className="w-full" />
      <Input name="source" placeholder="Source" className="w-full" />
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add candidate
      </Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}
