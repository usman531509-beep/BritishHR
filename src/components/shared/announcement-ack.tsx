"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { acknowledgeAnnouncement } from "@/lib/actions/messaging-actions";

export function AnnouncementAck({ announcementId, acknowledged }: { announcementId: string; acknowledged: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  if (acknowledged) {
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><Check className="h-3.5 w-3.5" /> Read</span>;
  }
  async function ack() {
    setLoading(true);
    const res = await acknowledgeAnnouncement({ announcementId });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }
  return (
    <button onClick={ack} disabled={loading} className="inline-flex items-center gap-1 rounded bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-dark hover:bg-brand/20 disabled:opacity-50">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Acknowledge
    </button>
  );
}
