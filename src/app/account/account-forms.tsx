"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { updateProfile, changePassword } from "@/lib/actions/account-actions";

type Defaults = { name: string; email: string; phone?: string; hasEmployee: boolean };

export function ProfileForm({ defaults }: { defaults: Defaults }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const res = await updateProfile(Object.fromEntries(fd.entries()));
    setLoading(false);
    if (!res.ok) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      toast.error(res.error);
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Full name" error={errors.name?.[0]}>
        <Input name="name" defaultValue={defaults.name} required />
      </Field>
      <Field label="Email address" error={errors.email?.[0]}>
        <Input name="email" type="email" defaultValue={defaults.email} required />
      </Field>
      {defaults.hasEmployee ? (
        <Field label="Phone" error={errors.phone?.[0]}>
          <Input name="phone" defaultValue={defaults.phone} placeholder="07… or +44…" />
        </Field>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const res = await changePassword(Object.fromEntries(fd.entries()));
    setLoading(false);
    if (!res.ok) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      toast.error(res.error);
      return;
    }
    toast.success("Password updated");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Current password" error={errors.currentPassword?.[0]}>
        <Input name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" error={errors.newPassword?.[0]}>
          <Input name="newPassword" type="password" autoComplete="new-password" required />
        </Field>
        <Field label="Confirm new password" error={errors.confirmPassword?.[0]}>
          <Input name="confirmPassword" type="password" autoComplete="new-password" required />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          Update password
        </Button>
      </div>
    </form>
  );
}
