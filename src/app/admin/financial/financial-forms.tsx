"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { addCustomer, addSupplier, createSalesInvoice, createBill, markLedgerPaid } from "@/lib/actions/accounting-actions";

type Party = { id: string; name: string };

function QuickName({ action, placeholder, onSuccess }: { action: (i: { name: string; email?: string }) => Promise<{ ok: boolean; error?: string }>; placeholder: string; onSuccess?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await action({ name });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    setName("");
    toast.success("Saved");
    router.refresh();
    onSuccess?.();
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} className="flex-1" autoFocus />
      <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}</Button>
    </form>
  );
}

export function CustomerForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  return <QuickName action={addCustomer as never} placeholder="New customer name" onSuccess={onSuccess} />;
}
export function SupplierForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  return <QuickName action={addSupplier as never} placeholder="New supplier name" onSuccess={onSuccess} />;
}

export function InvoiceForm({ customers, onSuccess }: { customers: Party[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("vatable", fd.get("vatable") ? "true" : "false");
    const res = await createSalesInvoice(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    toast.success("Invoice raised");
    router.refresh();
    onSuccess?.();
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Select name="customerId" required defaultValue="" className="w-full"><option value="" disabled>Customer…</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
      <Input name="number" placeholder="INV-0001" required className="w-full" />
      <Input name="net" type="number" step="0.01" min="0.01" placeholder="Net (£)" required className="w-full" />
      <Input name="dueAt" type="date" required className="w-full" />
      <label className="flex items-center gap-1.5 pb-2.5 text-sm text-muted-foreground"><input type="checkbox" name="vatable" defaultChecked /> VAT</label>
      <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Raise invoice</Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}

export function BillForm({ suppliers, onSuccess }: { suppliers: Party[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("vatable", fd.get("vatable") ? "true" : "false");
    const res = await createBill(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    toast.success("Bill recorded");
    router.refresh();
    onSuccess?.();
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Select name="supplierId" required defaultValue="" className="w-full"><option value="" disabled>Supplier…</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
      <Input name="reference" placeholder="Ref" className="w-full" />
      <Input name="net" type="number" step="0.01" min="0.01" placeholder="Net (£)" required className="w-full" />
      <Input name="dueAt" type="date" required className="w-full" />
      <label className="flex items-center gap-1.5 pb-2.5 text-sm text-muted-foreground"><input type="checkbox" name="vatable" defaultChecked /> VAT</label>
      <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Record bill</Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}

export function MarkPaidButton({ id, kind }: { id: string; kind: "invoice" | "bill" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function pay() {
    setLoading(true);
    const res = await markLedgerPaid({ id, kind });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  return (
    <button onClick={pay} disabled={loading} className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-success hover:bg-emerald-100 disabled:opacity-50">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Paid
    </button>
  );
}
