"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { createShift } from "@/lib/actions/attendance-actions";

export function ShiftForm({ employees, onSuccess }: { employees: { id: string; firstName: string; lastName: string }[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const input = Object.fromEntries(fd.entries()) as Record<string, string>;
    const res = await createShift(input as never);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Select name="employeeId" required defaultValue="" className="w-full">
        <option value="" disabled>Employee…</option>
        {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
      </Select>
      <Input name="date" type="date" required className="w-full" />
      <Input name="startTime" type="time" defaultValue="09:00" required className="w-full" />
      <Input name="endTime" type="time" defaultValue="17:00" required className="w-full" />
      <Input name="breakMinutes" type="number" min="0" defaultValue="30" className="w-20" title="Break (mins)" />
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add shift
      </Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}
