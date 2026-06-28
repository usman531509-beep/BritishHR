import { Plus } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { weekStart, addDays, weekShifts } from "@/lib/services/attendance";
import { scheduledHours } from "@/lib/domain/attendance";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { formatDate } from "@/lib/utils";

export default async function RotaPage({ searchParams }: { searchParams: Promise<{ offset?: string }> }) {
  const ctx = await requireTenant();
  const { offset } = await searchParams;
  const weekOffset = Number(offset ?? 0) || 0;

  const from = addDays(weekStart(), weekOffset * 7);
  const to = addDays(from, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));

  const canEdit = ctx.ability.can("attendance", "edit");
  const [shifts, employees] = await Promise.all([
    weekShifts(ctx.tenantId, from, to),
    prisma.employee.findMany({
      where: { tenantId: ctx.tenantId, deletedAt: null, status: { in: ["active", "onboarding"] } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  // Group shifts by employee then by yyyy-mm-dd.
  const byEmp = new Map<string, { name: string; days: Map<string, typeof shifts> }>();
  for (const e of employees) byEmp.set(e.id, { name: `${e.firstName} ${e.lastName}`, days: new Map() });
  for (const s of shifts) {
    const row = byEmp.get(s.employeeId);
    if (!row) continue;
    const key = new Date(s.date).toISOString().slice(0, 10);
    if (!row.days.has(key)) row.days.set(key, []);
    row.days.get(key)!.push(s);
  }
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Rota"
        subtitle={`Week of ${formatDate(from)}`}
        action={
          canEdit ? (
            <FormModalLauncher
              formKey="shift"
              formProps={{ employees }}
              title="Add shift"
              description="Schedule a shift for an employee."
              className="sm:max-w-xl"
              trigger={<Button><Plus className="h-4 w-4" /> Add shift</Button>}
            />
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <a href={`/manager/rota?offset=${weekOffset - 1}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-brand">← Previous</a>
        <a href={`/manager/rota?offset=0`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-brand">This week</a>
        <a href={`/manager/rota?offset=${weekOffset + 1}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-brand">Next →</a>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3 font-semibold">Employee</th>
              {days.map((d) => (
                <th key={dayKey(d)} className="px-2 py-3 text-center font-semibold">
                  {new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.map((e) => {
              const row = byEmp.get(e.id)!;
              return (
                <tr key={e.id}>
                  <td className="px-3 py-3 font-medium whitespace-nowrap">{e.firstName} {e.lastName}</td>
                  {days.map((d) => {
                    const ds = row.days.get(dayKey(d)) ?? [];
                    return (
                      <td key={dayKey(d)} className="px-2 py-2 text-center align-top">
                        {ds.map((s) => (
                          <div key={s.id} className="mb-1 rounded-md bg-brand/10 px-1.5 py-1 text-[0.7rem] font-medium text-brand-dark">
                            {s.startTime}–{s.endTime}
                            <span className="block text-[0.6rem] text-muted-foreground">{scheduledHours(s.startTime, s.endTime, s.breakMinutes)}h</span>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
