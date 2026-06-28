"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import {
  createDsar, progressDsar, createRiskAssessment, reviewRiskAssessment, logAccident, toggleRiddorReported,
} from "@/lib/actions/compliance-actions";

function useAction() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return { router, loading, setLoading, error, setError };
}

export function DsarForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const { router, loading, setLoading, error, setError } = useAction();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createDsar(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    toast.success("DSAR logged");
    router.refresh();
    onSuccess?.();
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input name="subjectName" placeholder="Subject name" required className="w-full" />
      <Input name="subjectEmail" type="email" placeholder="Email" className="w-full" />
      <Select name="type" defaultValue="access" className="w-full">
        <option value="access">Access</option>
        <option value="erasure">Erasure</option>
        <option value="rectification">Rectification</option>
        <option value="portability">Portability</option>
        <option value="restriction">Restriction</option>
        <option value="objection">Objection</option>
      </Select>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Log DSAR
      </Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}

export function DsarStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function set(s: string) {
    setLoading(true);
    const res = await progressDsar({ id, status: s as never });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  if (status === "completed" || status === "rejected") return null;
  return (
    <div className="flex gap-1">
      {status === "received" ? (
        <button onClick={() => set("in_progress")} disabled={loading} className="rounded bg-bg px-2 py-1 text-xs font-medium hover:bg-border disabled:opacity-50">Start</button>
      ) : null}
      <button onClick={() => set("completed")} disabled={loading} className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-success hover:bg-emerald-100 disabled:opacity-50">Complete</button>
    </div>
  );
}

export function RiskForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const { router, loading, setLoading, error, setError } = useAction();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createRiskAssessment(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    toast.success("Risk assessment added");
    router.refresh();
    onSuccess?.();
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input name="title" placeholder="Assessment title" required className="w-full" />
      <Input name="area" placeholder="Area" className="w-full" />
      <Select name="riskLevel" defaultValue="medium" className="w-full">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </Select>
      <Input name="nextReview" type="date" className="w-full" title="Next review" />
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add
      </Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}

export function RiskReview({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function review() {
    setLoading(true);
    const res = await reviewRiskAssessment({ id });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  return (
    <button onClick={review} disabled={loading} className="inline-flex items-center gap-1 rounded bg-brand/10 px-2 py-1 text-xs font-semibold text-brand-dark hover:bg-brand/20 disabled:opacity-50">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      Mark reviewed
    </button>
  );
}

export function AccidentForm({ employees, onSuccess }: { employees: { id: string; firstName: string; lastName: string }[]; onSuccess?: () => void }) {
  const { router, loading, setLoading, error, setError } = useAction();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("riddorReportable", fd.get("riddorReportable") ? "true" : "false");
    const res = await logAccident(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    toast.success("Incident logged");
    router.refresh();
    onSuccess?.();
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Select name="type" defaultValue="accident" className="w-full">
        <option value="accident">Accident</option>
        <option value="near_miss">Near-miss</option>
        <option value="dangerous_occurrence">Dangerous occurrence</option>
      </Select>
      <Input name="occurredAt" type="date" required className="w-full" />
      <Input name="location" placeholder="Location" className="w-full" />
      <Input name="description" placeholder="Description" required className="w-full" />
      <Select name="employeeId" defaultValue="" className="w-full">
        <option value="">Person (optional)</option>
        {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
      </Select>
      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <input type="checkbox" name="riddorReportable" /> RIDDOR
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Log
      </Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}

export function RiddorToggle({ id, reported }: { id: string; reported: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function toggle() {
    setLoading(true);
    const res = await toggleRiddorReported({ id });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  return (
    <button onClick={toggle} disabled={loading} className={`rounded px-2 py-1 text-xs font-semibold disabled:opacity-50 ${reported ? "bg-emerald-50 text-success" : "bg-red-50 text-danger"}`}>
      {reported ? "Reported to HSE" : "Mark reported"}
    </button>
  );
}
