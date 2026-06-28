"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { createAnnouncement } from "@/lib/actions/messaging-actions";

export function AnnouncementForm({ departments, onSuccess }: { departments: { id: string; name: string }[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState("all");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set("mandatory", fd.get("mandatory") ? "true" : "false");
    const res = await createAnnouncement(Object.fromEntries(fd.entries()) as never);
    setLoading(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: "Announcement published." });
    (e.target as HTMLFormElement).reset();
    setAudience("all");
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Title"><Input name="title" required placeholder="e.g. Office closed for bank holiday" /></Field>
      <Field label="Message">
        <textarea name="body" required rows={3} className="w-full rounded-[10px] border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40" placeholder="Write your announcement…" />
      </Field>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Field label="Audience">
            <Select name="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="w-auto">
              <option value="all">Everyone</option>
              <option value="department">A department</option>
            </Select>
          </Field>
        </div>
        {audience === "department" ? (
          <Select name="departmentId" defaultValue="" className="w-auto">
            <option value="" disabled>Department…</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        ) : null}
        <label className="flex items-center gap-1.5 pb-2.5 text-sm text-muted-foreground">
          <input type="checkbox" name="mandatory" /> Mandatory read
        </label>
        <Button type="submit" disabled={loading} className="ml-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />} Publish
        </Button>
      </div>
      {msg ? <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-success" : "bg-red-50 text-danger"}`}>{msg.text}</p> : null}
    </form>
  );
}
