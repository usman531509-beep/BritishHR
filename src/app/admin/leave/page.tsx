import Link from "next/link";
import { requireTenant } from "@/lib/auth/session";
import {
  listAllRequests,
  listLeaveTypes,
  leaveInRange,
  tenantAbsenceSummary,
} from "@/lib/services/leave";
import { bradfordFactor, type BradfordBand } from "@/lib/domain/bradford";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { ApprovalActions } from "@/components/shared/approval-actions";
import { LeaveCalendar, type CalendarEntry } from "@/components/shared/leave-calendar";
import { cn, formatDate } from "@/lib/utils";

const TABS = [
  { key: "requests", label: "Requests" },
  { key: "calendar", label: "Calendar" },
  { key: "types", label: "Leave Types" },
  { key: "absence", label: "Absence & Bradford" },
] as const;

const BAND_TONE: Record<BradfordBand, "success" | "warning" | "danger" | "neutral"> = {
  ok: "success",
  review: "warning",
  concern: "warning",
  action: "danger",
};

export default async function AdminLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = await requireTenant();
  const { tab = "requests" } = await searchParams;

  return (
    <>
      <PageHeader title="Leave & Absence" subtitle="Requests, calendar, policy and absence analytics" />

      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/leave?tab=${t.key}`}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium",
              tab === t.key ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-text",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "requests" ? <RequestsTab tenantId={ctx.tenantId} /> : null}
      {tab === "calendar" ? <CalendarTab tenantId={ctx.tenantId} /> : null}
      {tab === "types" ? <TypesTab tenantId={ctx.tenantId} /> : null}
      {tab === "absence" ? <AbsenceTab tenantId={ctx.tenantId} /> : null}
    </>
  );
}

async function RequestsTab({ tenantId }: { tenantId: string }) {
  const requests = await listAllRequests(tenantId);
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">Employee</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Dates</th>
            <th className="px-4 py-3 font-semibold">Days</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {requests.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No leave requests.</td></tr>
          ) : (
            requests.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.employee.firstName} {r.employee.lastName}</td>
                <td className="px-4 py-3"><Badge tone="brand">{r.leaveType.name}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(r.startDate)} → {formatDate(r.endDate)}</td>
                <td className="px-4 py-3">{r.days}</td>
                <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                <td className="px-4 py-3 text-right">{r.status === "pending" ? <ApprovalActions id={r.id} /> : null}</td>
              </tr>
            ))
          )}
        </tbody>
      </table></div>
    </Card>
  );
}

async function CalendarTab({ tenantId }: { tenantId: string }) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const from = new Date(Date.UTC(year, month, 1));
  const to = new Date(Date.UTC(year, month + 1, 0));
  const leave = await leaveInRange(tenantId, from, to);
  const entries: CalendarEntry[] = leave.map((l) => ({
    start: l.startDate,
    end: l.endDate,
    label: `${l.employee.firstName} ${l.employee.lastName.charAt(0)}.`,
    colour: l.leaveType.colour,
  }));
  return <LeaveCalendar year={year} month={month} entries={entries} />;
}

async function TypesTab({ tenantId }: { tenantId: string }) {
  const types = await listLeaveTypes(tenantId);
  return (
    <Card className="overflow-hidden">
      <CardHeader><CardTitle>Leave types</CardTitle></CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Paid</th>
              <th className="px-4 py-3 font-semibold">Affects balance</th>
              <th className="px-4 py-3 font-semibold">Default days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {types.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-medium">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: t.colour }} />
                  {t.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{t.code}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.category.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{t.isPaid ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{t.affectsBalance ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{t.defaultAllowanceDays ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </CardBody>
    </Card>
  );
}

async function AbsenceTab({ tenantId }: { tenantId: string }) {
  const employees = await tenantAbsenceSummary(tenantId);
  const rows = employees
    .map((e) => {
      const bf = bradfordFactor(
        e.absences.map((a) => ({ startDate: a.startDate, endDate: a.endDate, workingDays: a.workingDays })),
      );
      return { id: e.id, name: `${e.firstName} ${e.lastName}`, ...bf };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Bradford Factor (rolling 52 weeks)</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <p className="px-4 pt-3 text-xs text-muted-foreground">B = spells² × days. Trigger bands: 51 review · 200 concern · 500 action.</p>
        <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Spells</th>
              <th className="px-4 py-3 font-semibold">Days</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Band</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No recorded absence.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{r.spells}</td>
                  <td className="px-4 py-3">{r.days}</td>
                  <td className="px-4 py-3 font-semibold">{r.score}</td>
                  <td className="px-4 py-3"><Badge tone={BAND_TONE[r.band]}>{r.band}</Badge></td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </CardBody>
    </Card>
  );
}
