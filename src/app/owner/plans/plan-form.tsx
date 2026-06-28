"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { savePlan } from "@/lib/actions/plan-actions";

export type PlanDefaults = {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  maxEmployees?: number;
  features?: string; // newline-joined
  ctaText?: string;
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  subscriptions?: number;
};

export function PlanForm({ defaults = {}, isNew = false, onSuccess }: { defaults?: PlanDefaults; isNew?: boolean; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
    const input = {
      ...raw,
      id: defaults.id,
      isPopular: fd.get("isPopular") ? true : false,
      isActive: fd.get("isActive") ? true : false,
    };
    const res = await savePlan(input as never);
    setLoading(false);
    if (!res.ok) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      toast.error(res.error);
      return;
    }
    toast.success(isNew ? "Plan created" : "Plan saved");
    if (isNew) (e.target as HTMLFormElement).reset();
    router.refresh();
    onSuccess?.();
  }

  const err = (k: string) => errors[k]?.[0];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plan name" error={err("name")}>
          <Input name="name" defaultValue={defaults.name} required placeholder="Business" />
        </Field>
        <Field label="Price (£ / month)" error={err("price")}>
          <Input name="price" type="number" step="1" min="0" defaultValue={defaults.price} required />
        </Field>
      </div>

      <Field label="Description / tagline" error={err("description")}>
        <Input name="description" defaultValue={defaults.description} placeholder="For growing UK companies." />
      </Field>

      <Field label="Features (one per line)">
        <textarea
          name="features"
          rows={5}
          defaultValue={defaults.features}
          placeholder={"Up to 50 employees\nPayroll prep & pensions\nUK compliance"}
          className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Button text" error={err("ctaText")}>
          <Input name="ctaText" defaultValue={defaults.ctaText ?? "Start free trial"} />
        </Field>
        <Field label="Max employees (0 = ∞)" error={err("maxEmployees")}>
          <Input name="maxEmployees" type="number" min="0" defaultValue={defaults.maxEmployees ?? 0} />
        </Field>
        <Field label="Display order" error={err("sortOrder")}>
          <Input name="sortOrder" type="number" defaultValue={defaults.sortOrder ?? 0} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-5 pt-1">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPopular" defaultChecked={defaults.isPopular} /> Highlight as “Most popular”
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={defaults.isActive ?? true} /> Visible on pricing page
        </label>
      </div>

      <div className="flex items-center justify-end pt-1">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : isNew ? <Plus className="size-4" /> : <Save className="size-4" />}
          {isNew ? "Create plan" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
