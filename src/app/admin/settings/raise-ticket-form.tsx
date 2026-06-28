"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { raiseTicket } from "@/lib/actions/messaging-actions";

export function RaiseTicketForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await raiseTicket(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: "Ticket raised — our team will be in touch." });
    (e.target as HTMLFormElement).reset();
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input name="subject" required placeholder="Subject" className="flex-1" />
        <Field label="">
          <Select name="priority" defaultValue="normal" className="w-auto">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </Field>
      </div>
      <textarea name="body" required rows={3} placeholder="Describe your issue…" className="w-full rounded-[10px] border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40" />
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LifeBuoy className="h-4 w-4" />} Raise support ticket
      </Button>
      {msg ? <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-success" : "bg-red-50 text-danger"}`}>{msg.text}</p> : null}
    </form>
  );
}
