"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { startOnboarding } from "@/lib/actions/onboarding-actions";

export function StartOnboardingForm({ employees, onSuccess }: { employees: { id: string; firstName: string; lastName: string }[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const employeeId = String(fd.get("employeeId") || "");
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    const res = await startOnboarding({ employeeId });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
    onSuccess?.();
  }

  if (employees.length === 0) {
    return <p className="text-sm text-muted-foreground">All employees already have an onboarding checklist.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Select name="employeeId" required defaultValue="" className="w-full">
        <option value="" disabled>Select new starter…</option>
        {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
      </Select>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
        Start onboarding
      </Button>
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </form>
  );
}
