import "dotenv/config";
import { PrismaClient, RoleKey } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS } from "../src/lib/authz/permissions";
import { encryptField } from "../src/lib/crypto";
import { DEFAULT_ONBOARDING_TASKS } from "../src/lib/domain/onboarding";
import { computePayslip, TAX_YEAR } from "../src/lib/domain/payroll";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ROLE_META: Record<RoleKey, { name: string; description: string }> = {
  PLATFORM_OWNER: { name: "Platform Owner", description: "SaaS operator across all tenants" },
  HR_ADMIN: { name: "HR Administrator", description: "Full HR & payroll for one company" },
  MANAGER: { name: "Line Manager", description: "Team approvals, attendance, rota" },
  EMPLOYEE: { name: "Employee", description: "Self-service portal" },
  EXTERNAL: { name: "External (Accountant/Solicitor)", description: "Limited read access" },
};

async function main() {
  console.log("→ Seeding permissions & roles…");

  // 1. Permissions (union of all role permissions).
  const allPerms = Array.from(new Set(Object.values(ROLE_PERMISSIONS).flat()));
  await prisma.permission.createMany({
    data: allPerms.map((key) => ({ key })),
    skipDuplicates: true,
  });
  const permRows = await prisma.permission.findMany();
  const permId = new Map(permRows.map((p) => [p.key, p.id]));

  // 2. Roles + role_permissions.
  for (const key of Object.keys(ROLE_PERMISSIONS) as RoleKey[]) {
    const role = await prisma.role.upsert({
      where: { key },
      update: { name: ROLE_META[key].name, description: ROLE_META[key].description },
      create: { key, name: ROLE_META[key].name, description: ROLE_META[key].description },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: ROLE_PERMISSIONS[key]
        .map((pk) => permId.get(pk))
        .filter((id): id is string => !!id)
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }
  const roles = await prisma.role.findMany();
  const roleId = new Map(roles.map((r) => [r.key, r.id]));

  console.log("→ Seeding demo tenant (Hounslow Motorcycles Ltd)…");
  const tenant = await prisma.tenant.upsert({
    where: { slug: "hounslow-motorcycles" },
    update: {},
    create: {
      name: "Hounslow Motorcycles Ltd",
      slug: "hounslow-motorcycles",
      companiesHouseNo: "08123456",
      status: "active",
      featureFlags: { accounting: false },
    },
  });

  // 3. Org structure.
  const site = await prisma.site.create({
    data: { tenantId: tenant.id, name: "Head Office", city: "Hounslow", postcode: "TW3 1AB" },
  });
  const deptNames = ["Workshop", "Marketing", "Engineering", "Operations"];
  const depts: Record<string, string> = {};
  for (const name of deptNames) {
    const d = await prisma.department.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name } },
      update: {},
      create: { tenantId: tenant.id, siteId: site.id, name },
    });
    depts[name] = d.id;
  }
  const titles = ["Mechanic", "Senior Manager", "Software Engineer", "Marketing Executive", "Apprentice"];
  const titleId: Record<string, string> = {};
  for (const title of titles) {
    const t = await prisma.jobTitle.upsert({
      where: { tenantId_title: { tenantId: tenant.id, title } },
      update: {},
      create: { tenantId: tenant.id, title },
    });
    titleId[title] = t.id;
  }

  console.log("→ Seeding users (one per role)…");
  const pwHash = await bcrypt.hash("Password123!", 10);

  async function makeUser(email: string, name: string, role: RoleKey, tenantId: string | null) {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        passwordHash: pwHash,
        tenantId,
        roles: { create: { roleId: roleId.get(role)! } },
      },
    });
  }

  await makeUser("owner@complihr.co.uk", "Platform Owner", "PLATFORM_OWNER", null);
  await makeUser("hr@hounslow.co.uk", "Priya Shah (HR)", "HR_ADMIN", tenant.id);
  const managerUser = await makeUser("manager@hounslow.co.uk", "Sarah Johnson", "MANAGER", tenant.id);
  const employeeUser = await makeUser("employee@hounslow.co.uk", "Mir Azmath Sultan", "EMPLOYEE", tenant.id);
  await makeUser("accountant@external.co.uk", "External Accountant", "EXTERNAL", tenant.id);

  console.log("→ Seeding employees…");
  // Sarah Johnson is also a manager (line manager of the workshop team).
  const sarah = await prisma.employee.upsert({
    where: { tenantId_payrollRef: { tenantId: tenant.id, payrollRef: "EMP-002" } },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: managerUser.id,
      payrollRef: "EMP-002",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "manager@hounslow.co.uk",
      status: "active",
      startDate: new Date("2022-01-10"),
      annualSalaryPence: 5_400_000,
      departmentId: depts["Marketing"],
      jobTitleId: titleId["Senior Manager"],
      siteId: site.id,
      rightToWorkStatus: "verified",
      niNumberEnc: encryptField("QQ123456C"),
    },
  });

  await prisma.employee.upsert({
    where: { tenantId_payrollRef: { tenantId: tenant.id, payrollRef: "EMP-001" } },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: employeeUser.id,
      payrollRef: "EMP-001",
      firstName: "Mir Azmath",
      lastName: "Sultan",
      email: "employee@hounslow.co.uk",
      status: "active",
      startDate: new Date("2023-03-01"),
      annualSalaryPence: 3_200_000,
      departmentId: depts["Workshop"],
      jobTitleId: titleId["Mechanic"],
      siteId: site.id,
      managerId: sarah.id,
      rightToWorkStatus: "verified",
      niNumberEnc: encryptField("AB654321D"),
    },
  });

  await prisma.employee.upsert({
    where: { tenantId_payrollRef: { tenantId: tenant.id, payrollRef: "EMP-003" } },
    update: {},
    create: {
      tenantId: tenant.id,
      payrollRef: "EMP-003",
      firstName: "Michael",
      lastName: "Chen",
      status: "active",
      startDate: new Date("2021-09-15"),
      annualSalaryPence: 6_200_000,
      departmentId: depts["Engineering"],
      jobTitleId: titleId["Software Engineer"],
      siteId: site.id,
      managerId: sarah.id,
      rightToWorkStatus: "verified",
    },
  });

  await prisma.employee.upsert({
    where: { tenantId_payrollRef: { tenantId: tenant.id, payrollRef: "EMP-004" } },
    update: {},
    create: {
      tenantId: tenant.id,
      payrollRef: "EMP-004",
      firstName: "Lisa",
      lastName: "Garcia",
      status: "active",
      startDate: new Date("2024-02-01"),
      annualSalaryPence: 1_800_000,
      departmentId: depts["Workshop"],
      jobTitleId: titleId["Apprentice"],
      siteId: site.id,
      managerId: sarah.id,
      rightToWorkStatus: "verified",
    },
  });

  // Sarah's employment history (from prototype).
  await prisma.employmentHistory.createMany({
    data: [
      {
        tenantId: tenant.id,
        employeeId: sarah.id,
        title: "Promoted to Senior Manager",
        detail: "Promoted to Senior Manager (£54,000)",
        effectiveDate: new Date("2024-01-01"),
      },
      {
        tenantId: tenant.id,
        employeeId: sarah.id,
        title: "Marketing Executive",
        detail: "Marketing Executive (£42,000)",
        effectiveDate: new Date("2022-01-10"),
      },
    ],
  });

  // ── Leave & Absence (Phase 2) ──
  console.log("→ Seeding leave types, entitlements, requests & absence…");

  // Use an April–March UK leave year for the demo tenant.
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { leaveYearStartMonth: 4, leaveYearStartDay: 1 },
  });

  const leaveTypeDefs = [
    { code: "AL", name: "Annual Leave", category: "annual" as const, affectsBalance: true, isPaid: true, defaultAllowanceDays: 28, colour: "#06b6d4" },
    { code: "SICK", name: "Sickness", category: "sick" as const, affectsBalance: false, isPaid: true, defaultAllowanceDays: null, requiresApproval: false, colour: "#dc2626" },
    { code: "MAT", name: "Maternity", category: "maternity" as const, affectsBalance: false, isPaid: true, defaultAllowanceDays: null, colour: "#7c3aed" },
    { code: "PAT", name: "Paternity", category: "paternity" as const, affectsBalance: false, isPaid: true, defaultAllowanceDays: null, colour: "#2563eb" },
    { code: "UNPAID", name: "Unpaid Leave", category: "unpaid" as const, affectsBalance: false, isPaid: false, defaultAllowanceDays: null, colour: "#64748b" },
    { code: "TOIL", name: "TOIL", category: "toil" as const, affectsBalance: true, isPaid: true, defaultAllowanceDays: 0, colour: "#059669" },
  ];
  const leaveTypeId: Record<string, string> = {};
  for (const def of leaveTypeDefs) {
    const lt = await prisma.leaveType.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: def.code } },
      update: { name: def.name, colour: def.colour },
      create: { tenantId: tenant.id, ...def },
    });
    leaveTypeId[def.code] = lt.id;
  }

  const leaveYear = new Date().getUTCMonth() + 1 >= 4 ? new Date().getUTCFullYear() : new Date().getUTCFullYear() - 1;

  // Annual-leave entitlements (full-time → 28 days).
  const allEmployees = await prisma.employee.findMany({ where: { tenantId: tenant.id }, select: { id: true, payrollRef: true } });
  for (const emp of allEmployees) {
    await prisma.leaveEntitlement.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: leaveTypeId["AL"], year: leaveYear } },
      update: {},
      create: { tenantId: tenant.id, employeeId: emp.id, leaveTypeId: leaveTypeId["AL"], year: leaveYear, entitlementDays: 28 },
    });
  }

  const mir = allEmployees.find((e) => e.payrollRef === "EMP-001")!;
  const michael = allEmployees.find((e) => e.payrollRef === "EMP-003")!;

  // Reset and seed sample requests/absence idempotently.
  await prisma.leaveRequest.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.absenceRecord.deleteMany({ where: { tenantId: tenant.id } });

  await prisma.leaveRequest.createMany({
    data: [
      { tenantId: tenant.id, employeeId: mir.id, leaveTypeId: leaveTypeId["AL"], startDate: new Date(`${leaveYear}-08-04`), endDate: new Date(`${leaveYear}-08-08`), days: 5, status: "approved", approverId: sarah.id, decidedAt: new Date() },
      { tenantId: tenant.id, employeeId: mir.id, leaveTypeId: leaveTypeId["AL"], startDate: new Date(`${leaveYear}-12-22`), endDate: new Date(`${leaveYear}-12-24`), days: 3, status: "pending" },
      { tenantId: tenant.id, employeeId: michael.id, leaveTypeId: leaveTypeId["AL"], startDate: new Date(`${leaveYear}-09-15`), endDate: new Date(`${leaveYear}-09-19`), days: 5, status: "pending" },
    ],
  });

  // Mir: 3 short sickness spells → Bradford 3² × 4 = 36.
  await prisma.absenceRecord.createMany({
    data: [
      { tenantId: tenant.id, employeeId: mir.id, startDate: new Date(`${leaveYear}-04-08`), endDate: new Date(`${leaveYear}-04-09`), workingDays: 2, reason: "Flu", isSelfCertified: true },
      { tenantId: tenant.id, employeeId: mir.id, startDate: new Date(`${leaveYear}-06-03`), endDate: new Date(`${leaveYear}-06-03`), workingDays: 1, reason: "Migraine", isSelfCertified: true },
      { tenantId: tenant.id, employeeId: mir.id, startDate: new Date(`${leaveYear}-05-12`), endDate: new Date(`${leaveYear}-05-12`), workingDays: 1, reason: "Stomach bug", isSelfCertified: true },
    ],
  });

  // ── Attendance & Rota (Phase 2b) ──
  console.log("→ Seeding attendance, rota, recruitment & onboarding…");
  await prisma.timeEntry.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.shift.deleteMany({ where: { tenantId: tenant.id } });

  const monday = (() => {
    const n = new Date();
    const b = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
    b.setUTCDate(b.getUTCDate() - ((b.getUTCDay() + 6) % 7));
    return b;
  })();
  const dayAt = (offset: number, h: number, m = 0) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + offset);
    d.setUTCHours(h, m, 0, 0);
    return d;
  };
  const dateOnly = (offset: number) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + offset);
    return d;
  };

  // Completed timesheets for Mir (Mon–Wed), one submitted awaiting approval.
  await prisma.timeEntry.createMany({
    data: [
      { tenantId: tenant.id, employeeId: mir.id, date: dateOnly(0), clockIn: dayAt(0, 9), clockOut: dayAt(0, 17, 30), breakMinutes: 30, status: "approved", approverId: sarah.id },
      { tenantId: tenant.id, employeeId: mir.id, date: dateOnly(1), clockIn: dayAt(1, 9), clockOut: dayAt(1, 17, 30), breakMinutes: 30, status: "approved", approverId: sarah.id },
      { tenantId: tenant.id, employeeId: mir.id, date: dateOnly(2), clockIn: dayAt(2, 9), clockOut: dayAt(2, 18), breakMinutes: 30, status: "submitted" },
    ],
  });

  // Rota: Mir + Michael shifts across the week.
  await prisma.shift.createMany({
    data: [0, 1, 2, 3, 4].flatMap((d) => [
      { tenantId: tenant.id, employeeId: mir.id, date: dateOnly(d), startTime: "09:00", endTime: "17:30", breakMinutes: 30 },
      { tenantId: tenant.id, employeeId: michael.id, date: dateOnly(d), startTime: "10:00", endTime: "18:00", breakMinutes: 60 },
    ]),
  });

  // ── Recruitment (Phase 3) ──
  await prisma.vacancy.deleteMany({ where: { tenantId: tenant.id } });
  const vacancy = await prisma.vacancy.create({
    data: {
      tenantId: tenant.id,
      title: "Workshop Technician",
      departmentId: depts["Workshop"],
      positions: 2,
      status: "open",
      salaryMinPence: 2_600_000,
      salaryMaxPence: 3_200_000,
      description: "Service and repair customer motorcycles.",
    },
  });
  const candidateSeed = [
    { first: "Aisha", last: "Khan", stage: "offer" as const, source: "LinkedIn", offer: 2_800_000 },
    { first: "Tom", last: "Wright", stage: "interview" as const, source: "Indeed" },
    { first: "Priya", last: "Nair", stage: "screening" as const, source: "Referral" },
    { first: "James", last: "O'Connor", stage: "applied" as const, source: "Website" },
  ];
  for (const c of candidateSeed) {
    const candidate = await prisma.candidate.create({
      data: { tenantId: tenant.id, firstName: c.first, lastName: c.last, source: c.source },
    });
    const app = await prisma.application.create({
      data: { tenantId: tenant.id, vacancyId: vacancy.id, candidateId: candidate.id, stage: c.stage },
    });
    if (c.offer) {
      await prisma.offer.create({ data: { tenantId: tenant.id, applicationId: app.id, salaryPence: c.offer, status: "sent", sentAt: new Date() } });
    }
  }

  // ── Onboarding (Phase 3) ── default template + a live checklist for Lisa (apprentice).
  const lisa = allEmployees.find((e) => e.payrollRef === "EMP-004")!;
  await prisma.onboardingChecklist.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.onboardingTemplate.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.onboardingChecklist.create({
    data: {
      tenantId: tenant.id,
      employeeId: lisa.id,
      name: "Lisa Garcia — Onboarding",
      tasks: {
        create: DEFAULT_ONBOARDING_TASKS.map((t, i) => ({
          tenantId: tenant.id,
          title: t.title,
          category: t.category,
          sortOrder: i,
          status: i < 3 ? ("done" as const) : ("pending" as const),
          completedAt: i < 3 ? new Date() : null,
        })),
      },
    },
  });

  // ── UK Compliance (Phase 4) ──
  console.log("→ Seeding compliance (visas, RTW, DSAR, equality, H&S)…");
  await prisma.visa.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.rightToWorkCheck.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.dsarRequest.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.consentRecord.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.equalityRecord.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.riskAssessment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.accident.deleteMany({ where: { tenantId: tenant.id } });

  // Sponsor licence held by the company.
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { sponsorLicenceNo: "SPL-998877", sponsorLicenceRating: "A-rating", sponsorLicenceExpiry: new Date(`${leaveYear + 1}-03-31`) },
  });

  const inDays = (n: number) => new Date(Date.now() + n * 86_400_000);

  // Michael: sponsored Skilled Worker visa expiring soon → triggers an alert.
  await prisma.visa.create({
    data: { tenantId: tenant.id, employeeId: michael.id, type: "skilled_worker", visaNumberEnc: encryptField("BRP123456"), sponsored: true, cosRef: "COS-2024-001", expiryDate: inDays(45) },
  });
  await prisma.employee.update({ where: { id: michael.id }, data: { rightToWorkStatus: "verified", rightToWorkExpiry: inDays(45) } });

  await prisma.rightToWorkCheck.createMany({
    data: [
      { tenantId: tenant.id, employeeId: mir.id, checkType: "online_share_code", outcome: "passed", checkedById: null },
      { tenantId: tenant.id, employeeId: michael.id, checkType: "online_share_code", outcome: "follow_up", followUpDate: inDays(45) },
    ],
  });

  // DSARs: one in progress (due soon), one completed.
  await prisma.dsarRequest.createMany({
    data: [
      { tenantId: tenant.id, subjectName: "Former employee — J. Doe", subjectEmail: "jdoe@example.com", type: "access", status: "in_progress", receivedAt: inDays(-20), dueAt: inDays(10) },
      { tenantId: tenant.id, subjectName: "S. Patel", type: "erasure", status: "completed", receivedAt: inDays(-40), dueAt: inDays(-10), completedAt: inDays(-15) },
    ],
  });

  await prisma.consentRecord.create({
    data: { tenantId: tenant.id, employeeId: mir.id, purpose: "Internal newsletter", lawfulBasis: "consent", granted: true },
  });

  // Equality self-declarations (encrypted). Small sample → counts under 5 are suppressed.
  const equality = [
    { emp: mir.id, gender: "Male", ethnicity: "Asian British", disability: "No" },
    { emp: michael.id, gender: "Male", ethnicity: "Chinese", disability: "No" },
    { emp: sarah.id, gender: "Female", ethnicity: "White British", disability: "No" },
    { emp: lisa.id, gender: "Female", ethnicity: "White British", disability: "Yes" },
  ];
  for (const e of equality) {
    await prisma.equalityRecord.create({
      data: {
        tenantId: tenant.id, employeeId: e.emp,
        genderEnc: encryptField(e.gender), ethnicityEnc: encryptField(e.ethnicity), disabilityEnc: encryptField(e.disability),
      },
    });
  }

  // Risk assessments: one overdue review (triggers alert).
  await prisma.riskAssessment.createMany({
    data: [
      { tenantId: tenant.id, title: "Workshop machinery", area: "Workshop", riskLevel: "high", lastReviewed: inDays(-400), nextReview: inDays(-35) },
      { tenantId: tenant.id, title: "Display screen equipment", area: "Office", riskLevel: "low", lastReviewed: inDays(-30), nextReview: inDays(335) },
    ],
  });

  // Accidents: a RIDDOR-reportable one not yet reported (critical alert).
  await prisma.accident.createMany({
    data: [
      { tenantId: tenant.id, employeeId: mir.id, type: "accident", occurredAt: inDays(-5), location: "Workshop", description: "Slipped on spilled oil, sprained wrist — off work 8 days", riddorReportable: true, reportedToHse: false },
      { tenantId: tenant.id, type: "near_miss", occurredAt: inDays(-12), location: "Forecourt", description: "Pallet fell from rack, no injury", riddorReportable: false },
    ],
  });

  // ── Payroll & Benefits (Phase 5) ──
  console.log("→ Seeding pension, pay run, expenses & benefits…");
  await prisma.payslip.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.payRun.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.pensionEnrolment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.pensionScheme.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.expenseClaim.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.benefitInKind.deleteMany({ where: { tenantId: tenant.id } });

  const scheme = await prisma.pensionScheme.create({
    data: { tenantId: tenant.id, provider: "NEST", employeeRate: 0.05, employerRate: 0.03, isDefault: true },
  });
  // Enrol the salaried employees.
  for (const empId of [mir.id, sarah.id, michael.id]) {
    await prisma.pensionEnrolment.create({
      data: { tenantId: tenant.id, employeeId: empId, schemeId: scheme.id, status: "enrolled", enrolledAt: new Date() },
    });
  }

  // A finalised monthly pay run computed by the payroll engine.
  const salaried = await prisma.employee.findMany({
    where: { tenantId: tenant.id, deletedAt: null, annualSalaryPence: { not: null } },
    select: { id: true, annualSalaryPence: true, pensionEnrolment: { select: { status: true } } },
  });
  const payRun = await prisma.payRun.create({
    data: { tenantId: tenant.id, periodLabel: "April 2025", payDate: new Date(`${leaveYear}-04-28`), frequency: "monthly", taxYear: TAX_YEAR, status: "finalised" },
  });
  for (const e of salaried) {
    const enrolled = e.pensionEnrolment?.status === "enrolled";
    const b = computePayslip({ annualSalaryPence: e.annualSalaryPence!, periodsPerYear: 12, pensionEmployeeRate: enrolled ? 0.05 : 0, pensionEmployerRate: enrolled ? 0.03 : 0 });
    await prisma.payslip.create({
      data: {
        tenantId: tenant.id, payRunId: payRun.id, employeeId: e.id,
        grossPence: b.grossPence, incomeTaxPence: b.incomeTaxPence, employeeNiPence: b.employeeNiPence,
        employerNiPence: b.employerNiPence, pensionEmployeePence: b.pensionEmployeePence, pensionEmployerPence: b.pensionEmployerPence,
        studentLoanPence: b.studentLoanPence, netPence: b.netPence, taxYear: b.taxYear, breakdown: b as unknown as object,
      },
    });
  }

  // Expense claims (one pending → awaits manager approval).
  await prisma.expenseClaim.createMany({
    data: [
      { tenantId: tenant.id, employeeId: mir.id, category: "travel", amountPence: 4_500, description: "Train to supplier", incurredOn: inDays(-6), status: "pending" },
      { tenantId: tenant.id, employeeId: michael.id, category: "equipment", amountPence: 8_999, description: "USB-C dock", incurredOn: inDays(-15), status: "approved", approverId: sarah.id, decidedAt: inDays(-12) },
    ],
  });

  // Benefits in kind (P11D).
  await prisma.benefitInKind.createMany({
    data: [
      { tenantId: tenant.id, employeeId: sarah.id, type: "private_medical", description: "Bupa cover", cashEquivalentPence: 120_000, taxYear: TAX_YEAR },
      { tenantId: tenant.id, employeeId: michael.id, type: "company_car", description: "Tesla Model 3", cashEquivalentPence: 450_000, taxYear: TAX_YEAR },
    ],
  });

  // ── Platform, Billing & Messaging (Phase 6) ──
  console.log("→ Seeding plans, subscriptions, invoices, tickets & announcements…");

  const planDefs = [
    { name: "Starter", monthlyPence: 4_900, maxEmployees: 10, features: ["Core HR", "Leave", "Documents"], sortOrder: 1 },
    { name: "Business", monthlyPence: 14_900, maxEmployees: 50, features: ["Everything in Starter", "Payroll prep", "Compliance", "Recruitment"], sortOrder: 2 },
    { name: "Enterprise", monthlyPence: 29_900, maxEmployees: 0, features: ["Everything in Business", "Unlimited employees", "Priority support"], sortOrder: 3 },
  ];
  const planId: Record<string, string> = {};
  for (const p of planDefs) {
    const plan = await prisma.plan.upsert({ where: { name: p.name }, update: { monthlyPence: p.monthlyPence, features: p.features }, create: p });
    planId[p.name] = plan.id;
  }

  // Subscription + invoices for the demo tenant.
  await prisma.invoice.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.subscription.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.supportTicket.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.announcement.deleteMany({ where: { tenantId: tenant.id } });

  const sub = await prisma.subscription.create({
    data: { tenantId: tenant.id, planId: planId["Business"], status: "active", seats: 10, currentPeriodEnd: inDays(20) },
  });
  await prisma.invoice.createMany({
    data: [
      { tenantId: tenant.id, subscriptionId: sub.id, number: "INV-1001", amountPence: 14_900, status: "paid", issuedAt: inDays(-40), dueAt: inDays(-26), paidAt: inDays(-30) },
      { tenantId: tenant.id, subscriptionId: sub.id, number: "INV-1002", amountPence: 14_900, status: "due", issuedAt: inDays(-2), dueAt: inDays(12) },
    ],
  });

  // A couple of extra companies so the platform console has a portfolio.
  for (const extra of [
    { name: "Acme Corporation Ltd", slug: "acme-corp", plan: "Business", status: "active" as const },
    { name: "TechStart UK Ltd", slug: "techstart-uk", plan: "Enterprise", status: "active" as const },
    { name: "Bright Cafe Ltd", slug: "bright-cafe", plan: "Starter", status: "trial" as const },
  ]) {
    const t = await prisma.tenant.upsert({
      where: { slug: extra.slug },
      update: {},
      create: { name: extra.name, slug: extra.slug, status: extra.status },
    });
    await prisma.subscription.upsert({
      where: { tenantId: t.id },
      update: {},
      create: { tenantId: t.id, planId: planId[extra.plan], status: extra.status === "trial" ? "trialing" : "active", currentPeriodEnd: inDays(25) },
    });
  }

  // Support tickets (one open, one resolved).
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@hounslow.co.uk" }, select: { id: true } });
  await prisma.supportTicket.createMany({
    data: [
      { tenantId: tenant.id, subject: "How do I export a P11D?", body: "Need to send P11D data to our accountant.", status: "open", priority: "normal", createdByUserId: hrUser?.id ?? null },
      { tenantId: tenant.id, subject: "Add a second site", body: "We've opened a Reading branch.", status: "resolved", priority: "low", resolution: "Sites can be added under Departments.", createdByUserId: hrUser?.id ?? null },
    ],
  });

  // Announcements (one mandatory) + a read receipt from Mir.
  const ann = await prisma.announcement.create({
    data: { tenantId: tenant.id, title: "Office closed for August bank holiday", body: "The workshop will be closed on Monday 25 August. Enjoy the long weekend!", audience: "all", mandatory: true, publishedByUserId: hrUser?.id ?? null },
  });
  await prisma.announcement.create({
    data: { tenantId: tenant.id, title: "New cycle-to-work scheme", body: "We've launched a cycle-to-work benefit — see HR for details.", audience: "all", mandatory: false, publishedByUserId: hrUser?.id ?? null },
  });
  await prisma.announcementReceipt.create({ data: { announcementId: ann.id, employeeId: sarah.id } });

  // ── Accounting (Phase 7, optional add-on enabled for the demo tenant) ──
  console.log("→ Seeding accounting (enabling add-on for demo)…");
  await prisma.salesInvoice.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.bill.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.customer.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.supplier.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.tenant.update({ where: { id: tenant.id }, data: { featureFlags: { accounting: true } } });

  const cust1 = await prisma.customer.create({ data: { tenantId: tenant.id, name: "Hounslow Couriers Ltd", email: "ap@hcouriers.co.uk" } });
  const cust2 = await prisma.customer.create({ data: { tenantId: tenant.id, name: "West London Garages", email: "accounts@wlg.co.uk" } });
  const sup1 = await prisma.supplier.create({ data: { tenantId: tenant.id, name: "Triumph Parts UK" } });
  const sup2 = await prisma.supplier.create({ data: { tenantId: tenant.id, name: "Shell Fuels" } });

  const net = (p: number) => p;
  await prisma.salesInvoice.createMany({
    data: [
      { tenantId: tenant.id, customerId: cust1.id, number: "INV-2001", description: "Fleet servicing", netPence: 1_200_000, vatPence: 240_000, status: "paid", issuedAt: inDays(-30), dueAt: inDays(-16), paidAt: inDays(-20) },
      { tenantId: tenant.id, customerId: cust2.id, number: "INV-2002", description: "Parts supply", netPence: 450_000, vatPence: 90_000, status: "sent", issuedAt: inDays(-5), dueAt: inDays(9) },
      { tenantId: tenant.id, customerId: cust1.id, number: "INV-2003", description: "MOT contract", netPence: 800_000, vatPence: 160_000, status: "sent", issuedAt: inDays(-2), dueAt: inDays(26) },
    ],
  });
  await prisma.bill.createMany({
    data: [
      { tenantId: tenant.id, supplierId: sup1.id, reference: "TP-7781", description: "Spare parts", netPence: net(380_000), vatPence: 76_000, status: "paid", issuedAt: inDays(-25), dueAt: inDays(-11), paidAt: inDays(-15) },
      { tenantId: tenant.id, supplierId: sup2.id, reference: "SH-2231", description: "Fuel", netPence: net(120_000), vatPence: 24_000, status: "sent", issuedAt: inDays(-3), dueAt: inDays(11) },
    ],
  });

  console.log("✓ Seed complete.");
  console.log("  Logins (password: Password123!):");
  console.log("   • owner@complihr.co.uk        (Platform Owner)");
  console.log("   • hr@hounslow.co.uk           (HR Admin)");
  console.log("   • manager@hounslow.co.uk      (Manager)");
  console.log("   • employee@hounslow.co.uk     (Employee)");
  console.log("   • accountant@external.co.uk   (External)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
