"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/guard";

// Generic single-field create form. `action` is a Server Action that takes
// { [field]: string } and returns an ActionResult.
export function QuickAddForm<I>({
  action,
  field,
  placeholder,
  buttonLabel = "Add",
  onSuccess,
  autoFocus,
}: {
  action: (input: I) => Promise<ActionResult<{ id: string }>>;
  field: string;
  placeholder: string;
  buttonLabel?: string;
  onSuccess?: () => void;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    const res = await action({ [field]: value } as I);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setValue("");
    toast.success("Saved");
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="sm:flex-1"
      />
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {buttonLabel}
      </Button>
      {error ? <p className="self-center text-sm text-danger">{error}</p> : null}
    </form>
  );
}
