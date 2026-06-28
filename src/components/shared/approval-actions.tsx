"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { decideLeave } from "@/lib/actions/leave-actions";

export function ApprovalActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "approve" | "reject">(null);

  async function decide(decision: "approve" | "reject") {
    let note: string | undefined;
    if (decision === "reject") {
      note = prompt("Reason for rejection (optional)") ?? undefined;
    }
    setLoading(decision);
    const res = await decideLeave({ id, decision, note });
    setLoading(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => decide("approve")}
        disabled={!!loading}
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-success hover:bg-emerald-100 disabled:opacity-50"
      >
        {loading === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Approve
      </button>
      <button
        onClick={() => decide("reject")}
        disabled={!!loading}
        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-red-100 disabled:opacity-50"
      >
        {loading === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Reject
      </button>
    </div>
  );
}
