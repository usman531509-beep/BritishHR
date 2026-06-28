"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { createPayRun, finalisePayRun, setPensionEnrolment } from "@/lib/actions/payroll-actions";

export function CreatePayRunForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createPayRun(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    onSuccess?.();
    router.push(`/admin/payroll/${(res.data as { id: string }).id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input name="periodLabel" placeholder="e.g. April 2025" required className="w-full" />
      <Input name="payDate" type="date" required className="w-full" />
      <Select name="frequency" defaultValue="monthly" className="w-full">
        <option value="monthly">Monthly</option>
        <option value="fortnightly">Fortnightly</option>
        <option value="weekly">Weekly</option>
      </Select>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Run payroll
      </Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}

export function FinalisePayRunButton({ id }: { id: string }) {
  return (
    <ConfirmModal
      title="Finalise this pay run?"
      description="Payslips become visible to employees and the run can no longer be edited."
      confirmLabel="Finalise"
      successMessage="Pay run finalised"
      destructive={false}
      onConfirm={() => finalisePayRun({ id })}
      trigger={
        <Button>
          <Lock className="h-4 w-4" />
          Finalise pay run
        </Button>
      }
    />
  );
}

export function PensionStatusControl({ employeeId, status }: { employeeId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function set(s: string) {
    setLoading(true);
    const res = await setPensionEnrolment({ employeeId, status: s as never });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => set(e.target.value)}
      className="rounded-lg border border-border bg-surface px-2 py-1 text-xs disabled:opacity-50"
    >
      <option value="enrolled">Enrolled</option>
      <option value="opted_out">Opted out</option>
      <option value="postponed">Postponed</option>
      <option value="not_eligible">Not eligible</option>
    </select>
  );
}
