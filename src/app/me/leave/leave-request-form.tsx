"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { requestLeave } from "@/lib/actions/leave-actions";

export function LeaveRequestForm({
  leaveTypes,
  onSuccess,
}: {
  leaveTypes: { id: string; name: string }[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const input = Object.fromEntries(fd.entries()) as Record<string, string>;
    const res = await requestLeave(input as never);
    setLoading(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setMsg({ ok: true, text: "Leave requested — pending approval." });
    (e.target as HTMLFormElement).reset();
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Leave type">
        <Select name="leaveTypeId" required defaultValue="">
          <option value="" disabled>Select…</option>
          {leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date"><Input name="startDate" type="date" required /></Field>
        <Field label="End date"><Input name="endDate" type="date" required /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First day">
          <Select name="startPart" defaultValue="full">
            <option value="full">Full day</option>
            <option value="pm">Afternoon only</option>
          </Select>
        </Field>
        <Field label="Last day">
          <Select name="endPart" defaultValue="full">
            <option value="full">Full day</option>
            <option value="am">Morning only</option>
          </Select>
        </Field>
      </div>
      <Field label="Reason (optional)"><Input name="reason" placeholder="e.g. Family holiday" /></Field>

      {msg ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-success" : "bg-red-50 text-danger"}`}>
          {msg.text}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Request leave
      </Button>
    </form>
  );
}
