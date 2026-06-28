"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, X, BadgePoundSterling, Loader2 } from "lucide-react";
import { BOARD_COLUMNS } from "@/lib/domain/recruitment";
import { moveStage, makeOffer } from "@/lib/actions/recruitment-actions";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { FormModal } from "@/components/shared/form-modal";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import type { ApplicationStage } from "@prisma/client";

interface AppCard {
  id: string;
  stage: ApplicationStage;
  candidate: { firstName: string; lastName: string; email: string | null; source: string | null };
  offer: { salaryPence: number; status: string } | null;
}

const NEXT_STAGE: Partial<Record<ApplicationStage, ApplicationStage>> = {
  applied: "screening",
  screening: "interview",
  interview: "offer",
  offer: "hired",
};

const COLUMN_LABEL: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
};

function OfferForm({ applicationId, onSuccess }: { applicationId: string; onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await makeOffer({ applicationId, salary: Number(fd.get("salary")) });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    toast.success("Offer made");
    router.refresh();
    onSuccess?.();
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label="Offer salary (£)">
        <Input name="salary" type="number" step="0.01" min="0" placeholder="35000" required autoFocus />
      </Field>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Make offer
      </Button>
    </form>
  );
}

export function PipelineBoard({ applications }: { applications: AppCard[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function advance(app: AppCard) {
    const to = NEXT_STAGE[app.stage];
    if (!to) return;
    setBusy(app.id);
    const res = await moveStage({ applicationId: app.id, toStage: to });
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {BOARD_COLUMNS.map((col) => {
        const cards = applications.filter((a) => a.stage === col);
        return (
          <div key={col} className="rounded-[var(--radius-card)] border border-border bg-bg/40 p-2">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {COLUMN_LABEL[col]} <span className="ml-1 text-brand">{cards.length}</span>
            </p>
            <div className="space-y-2">
              {cards.map((a) => (
                <div key={a.id} className="rounded-lg border border-border bg-surface p-2.5 shadow-sm">
                  <p className="text-sm font-semibold">{a.candidate.firstName} {a.candidate.lastName}</p>
                  {a.candidate.source ? <p className="text-[0.65rem] text-muted-foreground">via {a.candidate.source}</p> : null}
                  {a.offer ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-[0.65rem] font-medium text-success">
                      <BadgePoundSterling className="h-3 w-3" /> {(a.offer.salaryPence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })}
                    </p>
                  ) : null}
                  {col !== "hired" ? (
                    <div className="mt-2 flex gap-1">
                      {NEXT_STAGE[a.stage] === "offer" ? (
                        <FormModal
                          title={`Make an offer — ${a.candidate.firstName} ${a.candidate.lastName}`}
                          description="Enter the proposed salary to move this candidate to the offer stage."
                          className="sm:max-w-sm"
                          trigger={
                            <button
                              disabled={busy === a.id}
                              className="inline-flex flex-1 items-center justify-center gap-0.5 rounded bg-brand/10 py-1 text-[0.65rem] font-semibold text-brand-dark hover:bg-brand/20 disabled:opacity-50"
                            >
                              Offer
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          }
                        >
                          <OfferForm applicationId={a.id} />
                        </FormModal>
                      ) : (
                        <button
                          onClick={() => advance(a)}
                          disabled={busy === a.id}
                          className="inline-flex flex-1 items-center justify-center gap-0.5 rounded bg-brand/10 py-1 text-[0.65rem] font-semibold text-brand-dark hover:bg-brand/20 disabled:opacity-50"
                        >
                          {COLUMN_LABEL[NEXT_STAGE[a.stage] ?? ""] ?? "Next"}
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                      <ConfirmModal
                        title={`Reject ${a.candidate.firstName} ${a.candidate.lastName}?`}
                        description="This moves the candidate to the rejected stage."
                        confirmLabel="Reject"
                        successMessage="Candidate rejected"
                        onConfirm={() => moveStage({ applicationId: a.id, toStage: "rejected" })}
                        trigger={
                          <button
                            disabled={busy === a.id}
                            className="rounded bg-red-50 px-1.5 py-1 text-danger hover:bg-red-100 disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        }
                      />
                    </div>
                  ) : null}
                </div>
              ))}
              {cards.length === 0 ? <p className="px-1 py-2 text-[0.65rem] text-muted-foreground">—</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
