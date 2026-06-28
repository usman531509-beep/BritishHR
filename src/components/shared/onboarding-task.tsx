"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, Loader2 } from "lucide-react";
import { toggleOnboardingTask } from "@/lib/actions/onboarding-actions";
import { cn, formatDate } from "@/lib/utils";

export function OnboardingTaskRow({
  id,
  title,
  category,
  status,
  dueDate,
  interactive,
}: {
  id: string;
  title: string;
  category: string;
  status: string;
  dueDate: Date | null;
  interactive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const done = status === "done";

  async function toggle() {
    if (!interactive) return;
    setLoading(true);
    const res = await toggleOnboardingTask({ taskId: id });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  return (
    <li className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
      <button
        onClick={toggle}
        disabled={!interactive || loading}
        className={cn("flex h-6 w-6 items-center justify-center rounded-full border", done ? "border-success bg-success text-white" : "border-border text-muted-foreground", interactive && "hover:border-brand")}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
      </button>
      <div className="flex-1">
        <p className={cn("text-sm font-medium", done && "text-muted-foreground line-through")}>{title}</p>
        <p className="text-xs text-muted-foreground">
          <span className="capitalize">{category}</span>
          {dueDate ? ` · due ${formatDate(dueDate)}` : ""}
        </p>
      </div>
    </li>
  );
}
