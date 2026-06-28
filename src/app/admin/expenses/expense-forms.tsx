"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Check, X, BadgePoundSterling } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { decideExpense, addBenefit, submitExpense } from "@/lib/actions/payroll-actions";

type Emp = { id: string; firstName: string; lastName: string };

export function ExpenseDecide({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  async function decide(decision: "approve" | "reject" | "paid") {
    setLoading(decision);
    const res = await decideExpense({ id, decision });
    setLoading(null);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  return (
    <div className="flex gap-1.5">
      <button onClick={() => decide("approve")} disabled={!!loading} className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-success hover:bg-emerald-100 disabled:opacity-50">
        {loading === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
      </button>
      <button onClick={() => decide("reject")} disabled={!!loading} className="rounded bg-red-50 px-2 py-1 text-danger hover:bg-red-100 disabled:opacity-50"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

export function MarkPaid({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function pay() {
    setLoading(true);
    const res = await decideExpense({ id, decision: "paid" });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  return (
    <button onClick={pay} disabled={loading} className="inline-flex items-center gap-1 rounded bg-brand/10 px-2 py-1 text-xs font-semibold text-brand-dark hover:bg-brand/20 disabled:opacity-50">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgePoundSterling className="h-3.5 w-3.5" />} Mark paid
    </button>
  );
}

export function BenefitForm({ employees, onSuccess }: { employees: Emp[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await addBenefit(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    toast.success("Benefit added");
    router.refresh();
    onSuccess?.();
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Select name="employeeId" required defaultValue="" className="w-full">
        <option value="" disabled>Employee…</option>
        {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
      </Select>
      <Select name="type" defaultValue="private_medical" className="w-full">
        <option value="company_car">Company car</option>
        <option value="private_medical">Private medical</option>
        <option value="fuel">Fuel</option>
        <option value="loan">Loan</option>
        <option value="accommodation">Accommodation</option>
        <option value="other">Other</option>
      </Select>
      <Input name="cashEquivalent" type="number" step="0.01" min="0" placeholder="Cash equiv. (£)" required className="w-full" />
      <Input name="description" placeholder="Description" className="w-full" />
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add benefit
      </Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}

export function ExpenseSubmitForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await submitExpense(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: "Expense submitted for approval." });
    (e.target as HTMLFormElement).reset();
    router.refresh();
    onSuccess?.();
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select name="category" defaultValue="travel" className="w-full">
          <option value="mileage">Mileage</option>
          <option value="travel">Travel</option>
          <option value="subsistence">Subsistence</option>
          <option value="equipment">Equipment</option>
          <option value="training">Training</option>
          <option value="other">Other</option>
        </Select>
        <Input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount (£)" required className="w-full" />
        <Input name="incurredOn" type="date" required className="w-full" />
      </div>
      <Input name="description" placeholder="What was it for?" required />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Submit expense
      </Button>
      {msg ? <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-success" : "bg-red-50 text-danger"}`}>{msg.text}</p> : null}
    </form>
  );
}
