"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { approveTimeEntry } from "@/lib/actions/attendance-actions";

export function TimeApproveActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "approve" | "reject">(null);

  async function decide(decision: "approve" | "reject") {
    setLoading(decision);
    const res = await approveTimeEntry({ id, decision });
    setLoading(null);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => decide("approve")}
        disabled={!!loading}
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-success hover:bg-emerald-100 disabled:opacity-50"
      >
        {loading === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={() => decide("reject")}
        disabled={!!loading}
        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-danger hover:bg-red-100 disabled:opacity-50"
      >
        {loading === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
