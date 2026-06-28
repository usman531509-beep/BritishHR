import { prisma } from "@/lib/db/prisma";
import { decryptField } from "@/lib/crypto";
import {
  daysUntil,
  expirySeverity,
  complianceScore,
  anonymisedCounts,
  type ComplianceAlert,
} from "@/lib/domain/compliance";

/** Aggregate compliance alerts across RTW, visas, documents, DSAR, H&S. */
export async function buildComplianceAlerts(tenantId: string) {
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 86_400_000);

  const [employees, visas, docs, dsars, risks, riddor] = await Promise.all([
    prisma.employee.findMany({
      where: { tenantId, deletedAt: null, OR: [{ rightToWorkExpiry: { lte: soon } }, { rightToWorkStatus: { in: ["pending", "expired", "follow_up_due"] } }] },
      select: { id: true, firstName: true, lastName: true, rightToWorkStatus: true, rightToWorkExpiry: true },
    }),
    prisma.visa.findMany({ where: { tenantId, expiryDate: { lte: soon } }, include: { employee: { select: { firstName: true, lastName: true } } } }),
    prisma.document.findMany({ where: { tenantId, deletedAt: null, expiresAt: { lte: soon } }, select: { id: true, title: true, expiresAt: true } }),
    prisma.dsarRequest.findMany({ where: { tenantId, status: { in: ["received", "in_progress"] } } }),
    prisma.riskAssessment.findMany({ where: { tenantId, status: "active", nextReview: { lte: soon } } }),
    prisma.accident.findMany({ where: { tenantId, riddorReportable: true, reportedToHse: false } }),
  ]);

  const alerts: ComplianceAlert[] = [];

  for (const e of employees) {
    if (e.rightToWorkExpiry) {
      const d = daysUntil(e.rightToWorkExpiry, now);
      alerts.push({
        category: "right_to_work",
        severity: expirySeverity(d),
        title: `Right-to-Work expiring: ${e.firstName} ${e.lastName}`,
        detail: d < 0 ? `Expired ${-d} day(s) ago` : `Expires in ${d} day(s)`,
        dueInDays: d,
      });
    } else if (e.rightToWorkStatus !== "verified") {
      alerts.push({
        category: "right_to_work",
        severity: e.rightToWorkStatus === "expired" ? "critical" : "warning",
        title: `Right-to-Work ${e.rightToWorkStatus.replace(/_/g, " ")}: ${e.firstName} ${e.lastName}`,
        detail: "No verified RTW check on record",
      });
    }
  }

  for (const v of visas) {
    if (!v.expiryDate) continue;
    const d = daysUntil(v.expiryDate, now);
    alerts.push({
      category: "immigration",
      severity: expirySeverity(d),
      title: `Visa expiring: ${v.employee.firstName} ${v.employee.lastName}`,
      detail: d < 0 ? `Expired ${-d} day(s) ago` : `Expires in ${d} day(s)`,
      dueInDays: d,
    });
  }

  for (const doc of docs) {
    if (!doc.expiresAt) continue;
    const d = daysUntil(doc.expiresAt, now);
    alerts.push({ category: "document", severity: expirySeverity(d), title: `Document expiring: ${doc.title}`, detail: d < 0 ? `Expired ${-d} day(s) ago` : `Expires in ${d} day(s)`, dueInDays: d });
  }

  for (const r of dsars) {
    const d = daysUntil(r.dueAt, now);
    alerts.push({
      category: "gdpr",
      severity: d <= 0 ? "critical" : d <= 7 ? "warning" : "info",
      title: `DSAR (${r.type}) — ${r.subjectName}`,
      detail: d < 0 ? `Statutory deadline overdue by ${-d} day(s)` : `Due in ${d} day(s)`,
      dueInDays: d,
    });
  }

  for (const ra of risks) {
    const d = ra.nextReview ? daysUntil(ra.nextReview, now) : 0;
    alerts.push({ category: "health_safety", severity: d < 0 ? "critical" : "warning", title: `Risk assessment review due: ${ra.title}`, detail: d < 0 ? `Review overdue by ${-d} day(s)` : `Review in ${d} day(s)`, dueInDays: d });
  }

  for (const a of riddor) {
    alerts.push({ category: "health_safety", severity: "critical", title: "RIDDOR-reportable incident not reported", detail: a.description.slice(0, 80) });
  }

  alerts.sort((x, y) => (x.dueInDays ?? 0) - (y.dueInDays ?? 0));

  const failing = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;
  const monitored = await monitoredCount(tenantId);
  const score = complianceScore({ total: Math.max(monitored, alerts.length), failing, warning });

  return { alerts, score, failing, warning };
}

async function monitoredCount(tenantId: string) {
  const [emp, visas, docs, risks] = await Promise.all([
    prisma.employee.count({ where: { tenantId, deletedAt: null } }),
    prisma.visa.count({ where: { tenantId } }),
    prisma.document.count({ where: { tenantId, deletedAt: null, expiresAt: { not: null } } }),
    prisma.riskAssessment.count({ where: { tenantId } }),
  ]);
  return emp + visas + docs + risks;
}

// ── Immigration page data ──
export async function immigrationData(tenantId: string) {
  const [employees, tenant] = await Promise.all([
    prisma.employee.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true, firstName: true, lastName: true, rightToWorkStatus: true, rightToWorkExpiry: true,
        visas: { orderBy: { expiryDate: "desc" } },
        rtwChecks: { orderBy: { checkedAt: "desc" }, take: 1 },
      },
      orderBy: { lastName: "asc" },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { sponsorLicenceNo: true, sponsorLicenceRating: true, sponsorLicenceExpiry: true } }),
  ]);
  const sponsoredCount = employees.filter((e) => e.visas.some((v) => v.sponsored)).length;
  return { employees, tenant, sponsoredCount };
}

// ── GDPR page data ──
export async function gdprData(tenantId: string) {
  const [dsars, consents, retentionDocs] = await Promise.all([
    prisma.dsarRequest.findMany({ where: { tenantId }, orderBy: { receivedAt: "desc" } }),
    prisma.consentRecord.findMany({ where: { tenantId }, include: { employee: { select: { firstName: true, lastName: true } } }, orderBy: { grantedAt: "desc" }, take: 50 }),
    prisma.document.count({ where: { tenantId, retainUntil: { not: null } } }),
  ]);
  return { dsars, consents, retentionDocs };
}

// ── Equality (anonymised aggregation) ──
export async function equalityAggregates(tenantId: string) {
  const records = await prisma.equalityRecord.findMany({ where: { tenantId } });
  const decode = (key: keyof (typeof records)[number]) =>
    records.map((r) => decryptField(r[key] as string | null));
  return {
    responses: records.length,
    gender: anonymisedCounts(decode("genderEnc")),
    ethnicity: anonymisedCounts(decode("ethnicityEnc")),
    disability: anonymisedCounts(decode("disabilityEnc")),
  };
}

// ── Health & Safety page data ──
export async function healthSafetyData(tenantId: string) {
  const [risks, accidents] = await Promise.all([
    prisma.riskAssessment.findMany({ where: { tenantId }, orderBy: { nextReview: "asc" } }),
    prisma.accident.findMany({ where: { tenantId }, include: { employee: { select: { firstName: true, lastName: true } } }, orderBy: { occurredAt: "desc" }, take: 50 }),
  ]);
  return { risks, accidents };
}
