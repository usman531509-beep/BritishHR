"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clockIn, clockOut } from "@/lib/actions/attendance-actions";

export function ClockWidget({ openSince }: { openSince: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Start null so SSR and the first client render agree (no Date.now() at render).
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!openSince) return;
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [openSince]);

  const elapsed = openSince
    ? now
      ? formatElapsed(now - new Date(openSince).getTime())
      : "00:00:00"
    : null;

  async function doClockIn() {
    setLoading(true);
    const res = await clockIn({});
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  async function doClockOut() {
    const mins = prompt("Break taken (minutes)?", "30");
    if (mins === null) return;
    setLoading(true);
    const res = await clockOut({ breakMinutes: Number(mins) || 0 });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-6 text-center shadow-sm">
      {openSince ? (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-success">Clocked in</p>
          <p className="font-display text-4xl font-extrabold tabular-nums">{elapsed}</p>
          <Button variant="danger" onClick={doClockOut} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
            Clock out
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Not clocked in</p>
          <p className="font-display text-4xl font-extrabold tabular-nums text-muted-foreground">00:00:00</p>
          <Button onClick={doClockIn} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Clock in
          </Button>
        </>
      )}
    </div>
  );
}

function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}
