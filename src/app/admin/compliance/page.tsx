import Link from "next/link";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  buildComplianceAlerts, gdprData, equalityAggregates, healthSafetyData,
} from "@/lib/services/compliance";
import { scoreBand } from "@/lib/domain/compliance";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { cn, formatDate } from "@/lib/utils";
import { DsarStatus, RiskReview, RiddorToggle } from "./compliance-forms";

const TABS = [
  { key: "overview", label: "Alerts & Score" },
  { key: "gdpr", label: "GDPR / DSAR" },
  { key: "equality", label: "Equality & Diversity" },
  { key: "hs", label: "Health & Safety" },
] as const;

const sevTone = { critical: "danger", warning: "warning", info: "neutral" } as const;

export default async function CompliancePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await requireTenant();
  const { tab = "overview" } = await searchParams;

  return (
    <>
      <PageHeader title="Compliance Intelligence" subtitle="UK compliance alerts, GDPR, equality and health & safety" />
      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/compliance?tab=${t.key}`} className={cn("border-b-2 px-4 py-2 text-sm font-medium", tab === t.key ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-text")}>
            {t.label}
          </Link>
        ))}
      </div>
      {tab === "overview" ? <OverviewTab tenantId={ctx.tenantId} /> : null}
      {tab === "gdpr" ? <GdprTab tenantId={ctx.tenantId} /> : null}
      {tab === "equality" ? <EqualityTab tenantId={ctx.tenantId} /> : null}
      {tab === "hs" ? <HsTab tenantId={ctx.tenantId} /> : null}
    </>
  );
}

async function OverviewTab({ tenantId }: { tenantId: string }) {
  const { alerts, score, failing, warning } = await buildComplianceAlerts(tenantId);
  const band = scoreBand(score);
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Compliance score" value={`${score}%`} tone={band === "info" ? "success" : band === "warning" ? "warning" : "danger"} />
        <StatCard label="Critical issues" value={failing} tone={failing ? "danger" : "success"} />
        <StatCard label="Warnings" value={warning} tone={warning ? "warning" : "success"} />
      </div>
      <Card>
        <CardHeader><CardTitle>Active alerts</CardTitle></CardHeader>
        <CardBody>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No compliance alerts — everything is up to date. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <Badge tone={sevTone[a.severity]}>{a.category.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}

async function GdprTab({ tenantId }: { tenantId: string }) {
  const { dsars, consents, retentionDocs } = await gdprData(tenantId);
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>DSAR requests</CardTitle>
          <FormModalLauncher
            formKey="dsar"
            title="Log a Data Subject Access Request"
            description="Record a new GDPR data subject request and start the statutory clock."
            trigger={<Button size="sm"><Plus className="h-4 w-4" /> Log DSAR</Button>}
          />
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold">Statutory due</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dsars.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No DSARs logged.</td></tr>
              ) : dsars.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium">{d.subjectName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(d.receivedAt)}</td>
                  <td className="px-4 py-3">{formatDate(d.dueAt)}</td>
                  <td className="px-4 py-3"><Badge tone={d.status === "completed" ? "success" : d.status === "rejected" ? "danger" : "warning"}>{d.status.replace(/_/g, " ")}</Badge></td>
                  <td className="px-4 py-3 text-right"><DsarStatus id={d.id} status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent consent records</CardTitle></CardHeader>
          <CardBody>
            {consents.length === 0 ? <p className="text-sm text-muted-foreground">No consent records.</p> : (
              <ul className="space-y-1.5 text-sm">
                {consents.slice(0, 8).map((c) => (
                  <li key={c.id} className="flex justify-between border-b border-border py-1.5 last:border-0">
                    <span>{c.employee.firstName} {c.employee.lastName} — {c.purpose}</span>
                    <Badge tone={c.granted ? "success" : "neutral"}>{c.lawfulBasis.replace(/_/g, " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Data retention</CardTitle></CardHeader>
          <CardBody>
            <p className="text-sm text-muted-foreground">{retentionDocs} document(s) have a defined retention date. Records past their retention date are flagged for review and erasure under your retention policy.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function EqualityBlock({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody>
        {Object.keys(data).length === 0 ? <p className="text-sm text-muted-foreground">No data.</p> : (
          <ul className="space-y-1.5 text-sm">
            {Object.entries(data).map(([k, n]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="font-medium">{n}</span></li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

async function EqualityTab({ tenantId }: { tenantId: string }) {
  const agg = await equalityAggregates(tenantId);
  return (
    <>
      <Card className="mb-6">
        <CardBody className="text-sm text-muted-foreground">
          Equality & diversity data is <strong>special-category personal data</strong>: stored encrypted and only ever
          shown here in aggregate, with any group smaller than 5 suppressed to prevent re-identification.
          {agg.responses} response(s) collected.
        </CardBody>
      </Card>
      <div className="grid gap-6 sm:grid-cols-3">
        <EqualityBlock title="Gender" data={agg.gender} />
        <EqualityBlock title="Ethnicity" data={agg.ethnicity} />
        <EqualityBlock title="Disability" data={agg.disability} />
      </div>
    </>
  );
}

async function HsTab({ tenantId }: { tenantId: string }) {
  const { risks, accidents } = await healthSafetyData(tenantId);
  const employees = await prisma.employee.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } });
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Risk assessments</CardTitle>
          <FormModalLauncher
            formKey="risk"
            title="New risk assessment"
            description="Record a workplace risk assessment and schedule its review."
            trigger={<Button size="sm"><Plus className="h-4 w-4" /> New assessment</Button>}
          />
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Area</th>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold">Next review</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {risks.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No risk assessments.</td></tr> : risks.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.area ?? "—"}</td>
                  <td className="px-4 py-3"><Badge tone={r.riskLevel === "high" ? "danger" : r.riskLevel === "medium" ? "warning" : "neutral"}>{r.riskLevel}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.nextReview ? formatDate(r.nextReview) : "—"}</td>
                  <td className="px-4 py-3 text-right"><RiskReview id={r.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Accident book & RIDDOR</CardTitle>
          <FormModalLauncher
            formKey="accident"
            formProps={{ employees }}
            title="Log an incident"
            description="Record an accident, near-miss or dangerous occurrence."
            className="sm:max-w-xl"
            trigger={<Button size="sm"><Plus className="h-4 w-4" /> Log incident</Button>}
          />
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">RIDDOR</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accidents.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No incidents recorded.</td></tr> : accidents.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">{formatDate(a.occurredAt)}</td>
                  <td className="px-4 py-3"><Badge tone={a.type === "accident" ? "warning" : "neutral"}>{a.type.replace(/_/g, " ")}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{a.description.slice(0, 60)}</td>
                  <td className="px-4 py-3">{a.riddorReportable ? <Badge tone="danger">Reportable</Badge> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3 text-right">{a.riddorReportable ? <RiddorToggle id={a.id} reported={a.reportedToHse} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
