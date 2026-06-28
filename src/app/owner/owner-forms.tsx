"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { provisionTenant, updateSubscription, markInvoicePaid, resolveTicket, generateInvoice, toggleFeature } from "@/lib/actions/owner-actions";

type Plan = { id: string; name: string };

export function ProvisionTenantForm({ plans, onSuccess }: { plans: Plan[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await provisionTenant(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: "Company provisioned. Admin can sign in with Password123!" });
    (e.target as HTMLFormElement).reset();
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Company name"><Input name="companyName" required placeholder="Acme Ltd" /></Field>
      <Field label="Slug"><Input name="slug" required placeholder="acme-ltd" /></Field>
      <Field label="Plan">
        <Select name="planId" required defaultValue="">
          <option value="" disabled>Select plan…</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Field>
      <div />
      <Field label="Admin name"><Input name="adminName" required placeholder="Jane Doe" /></Field>
      <Field label="Admin email"><Input name="adminEmail" type="email" required placeholder="jane@acme.co.uk" /></Field>
      {msg ? <p className={`sm:col-span-2 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-success" : "bg-red-50 text-danger"}`}>{msg.text}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />} Provision company
        </Button>
      </div>
    </form>
  );
}

export function SubscriptionControl({ tenantId, planId, status, plans }: { tenantId: string; planId: string; status: string; plans: { id: string; name: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(planId);
  const [st, setSt] = useState(status);

  async function save() {
    setLoading(true);
    const res = await updateSubscription({ tenantId, planId: plan, status: st as never });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-auto">
        {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select>
      <Select value={st} onChange={(e) => setSt(e.target.value)} className="w-auto">
        <option value="trialing">Trialing</option>
        <option value="active">Active</option>
        <option value="past_due">Past due</option>
        <option value="cancelled">Cancelled</option>
      </Select>
      <Button size="sm" onClick={save} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
    </div>
  );
}

export function InvoicePaidButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function pay() {
    setLoading(true);
    const res = await markInvoicePaid({ id });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  return <button onClick={pay} disabled={loading} className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-success hover:bg-emerald-100 disabled:opacity-50">Mark paid</button>;
}

export function GenerateInvoiceButton({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function gen() {
    setLoading(true);
    const res = await generateInvoice({ id: tenantId });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  return (
    <Button size="sm" variant="secondary" onClick={gen} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Generate invoice
    </Button>
  );
}

export function FeatureToggle({ tenantId, flag, enabled, label }: { tenantId: string; flag: string; enabled: boolean; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [on, setOn] = useState(enabled);
  async function toggle() {
    setLoading(true);
    const res = await toggleFeature({ tenantId, flag: flag as never, enabled: !on });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    setOn(!on);
    router.refresh();
  }
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-brand" : "bg-slate-300"}`}
        aria-pressed={on}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

export function TicketControl({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function set(s: string) {
    let resolution: string | undefined;
    if (s === "resolved") resolution = prompt("Resolution note (optional)") ?? undefined;
    setLoading(true);
    const res = await resolveTicket({ id, status: s as never, resolution });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  if (status === "closed") return null;
  return (
    <select value={status} disabled={loading} onChange={(e) => set(e.target.value)} className="rounded-lg border border-border bg-surface px-2 py-1 text-xs disabled:opacity-50">
      <option value="open">Open</option>
      <option value="in_progress">In progress</option>
      <option value="resolved">Resolved</option>
      <option value="closed">Closed</option>
    </select>
  );
}
