# CompliHR UK

Enterprise HR, payroll & UK-compliance platform. Re-platformed from a static HTML
prototype into a production-grade **Next.js 16 (App Router) + TypeScript + Tailwind v4 +
PostgreSQL (Prisma)** application.

> **Build status:** Phases 0–7 complete (full roadmap) — Foundation, People core, Leave & Absence,
> Attendance & Rota, Recruitment & Onboarding, UK Compliance, Payroll & Benefits,
> Platform & Insights, and the optional Accounting / CT600 add-on.
> Full analysis, architecture, DB design and the 7-phase roadmap are in
> [`docs/ANALYSIS_AND_ARCHITECTURE.md`](docs/ANALYSIS_AND_ARCHITECTURE.md).
> The original prototype is preserved in [`prototype/`](prototype/).

## What's built

**Foundation**
- Multi-tenant data model (`tenantId` on every business table, RLS-ready for Supabase).
- Auth.js v5 (credentials, JWT sessions) carrying `tenantId`, `roles`, `permissions`.
- Data-driven **RBAC** (5 roles × `module:action` permission matrix) enforced in a
  `guardedAction` pipeline: _authenticate → tenant-scope → authorize → validate (Zod) → execute → audit_.
- Field-level **AES-256-GCM encryption** for special-category PII (NI number), with masked display.
- Append-only **audit log**; UK validators (NI / postcode / UTR / Companies House); money-in-pence.
- **shadcn/ui** design system (Radix primitives, Tailwind v4 tokens) — professional portal shell with collapsible/sheet sidebar, breadcrumb header, ⌘K command palette, avatar menu, light/dark mode, 6 brand accents, and sonner toasts. All sections share consistent Card/Table/Badge/StatCard primitives.

**People core**
- Employees: list (search + filter), profile, create & edit (with starting contract), soft-delete ready.
- Departments, Job Titles (quick-add), Org structure (reporting tree), Documents (model + view).
- Role homes: HR Admin (`/admin`), Manager (`/manager` + My Team), Employee self-service (`/me`),
  External read-only (`/external`), Platform Owner (`/owner`).
- Later modules (payroll, recruitment, compliance, immigration…) are navigable placeholders
  whose data model & routes are already scaffolded.

**Leave & Absence (Phase 2)**
- UK statutory entitlement engine (5.6 weeks, 28-day cap, FTE & part-year pro-rata) — unit-tested.
- Leave request lifecycle state machine (draft→pending→approved/rejected→cancelled→taken) enforced in actions.
- Employee self-service (`/me/leave`): live balances, booking with half-days, balance enforcement.
- Manager approvals (`/manager/approvals`): scoped to direct reports; HR sees all.
- Admin (`/admin/leave`): requests, month calendar, leave-type policy, **Bradford Factor** absence analytics.
- `npm test` runs the domain engine suite (67 tests across leave, attendance, recruitment, onboarding, compliance, payroll & accounting).

**Attendance & Rota (Phase 2b)**
- Clock-in/out with a live timer (`/me/timesheet`); worked-hours calculation.
- Manager & admin timesheet approval; **Working Time Directive** 48h weekly-hours monitoring with breach flags.
- Weekly **rota** grid (`/manager/rota`) with shift creation and scheduled-hours totals.

**Recruitment & Onboarding (Phase 3)**
- Vacancies + applicant tracking with a **Kanban pipeline board** (applied→screening→interview→offer→hired), stage state machine, reject/withdraw, and offers.
- Onboarding checklists generated from a UK default template (RTW, contract, P45, pension auto-enrolment, induction…), progress tracking; employee self-service task completion (`/me/onboarding`).

**UK Compliance (Phase 4)**
- **Compliance dashboard** (`/admin/compliance`) with a live compliance score and an alerts engine aggregating RTW/visa/document expiries, DSAR deadlines, overdue risk-assessment reviews and unreported RIDDOR incidents.
- **Immigration & RTW** (`/admin/immigration`): Right-to-Work check register, visa tracking (encrypted numbers) with expiry alerts, sponsored-worker/CoS and Home Office sponsor-licence management.
- **GDPR**: DSAR workflow with the statutory 1-calendar-month deadline auto-calculated, consent/lawful-basis register, retention overview.
- **Equality & Diversity**: special-category self-declarations stored encrypted and reported only in aggregate, with small groups (<5) suppressed to prevent re-identification.
- **Health & Safety**: risk assessments with review cycles, accident book / near-miss log, RIDDOR-reportable flagging.
- External accountant/solicitor read-only compliance view (`/external/compliance`).

**Payroll & Benefits (Phase 5)**
- **UK payroll engine** (2024/25, rUK): PAYE income tax with personal-allowance taper, Class 1 employee & employer NI, pension qualifying-earnings, student loan (Plans 1/2/4 + PG), and SSP/SMP/SPP statutory pay — all integer-pence and unit-tested against hand-verified figures.
- **Pay runs** (`/admin/payroll`): one click generates per-employee payslips; draft → finalise; employer-cost totals.
- **Pension auto-enrolment**: worker categorisation (eligible/non-eligible/entitled) and enrolment management.
- **Payslips** for employees (`/me/payslips`) with full payments/deductions/employer-cost breakdown, scoped so users see only their own.
- **Expenses**: employee self-service submission (`/me/expenses`), manager/HR approval and mark-paid.
- **Benefits in kind / P11D** (`/admin/expenses`): cash-equivalent tracking with employer Class 1A NIC.
- External read-only payroll summaries (`/external/payroll`).

**Platform & Insights (Phase 6)**
- **Platform-Owner SaaS console** (`/owner`): companies portfolio, **one-click company provisioning** (creates tenant + trial subscription + HR admin user), per-company detail with subscription management and invoices, MRR dashboard, and cross-tenant **support tickets**.
- **Reporting & Analytics** (`/admin/reports`): dependency-free charts for headcount by department, employee status, leave taken, recruitment funnel, anonymised gender diversity, payroll cost, and compliance score.
- **Messaging & Announcements** (`/admin/messaging`): company-wide or per-department announcements with mandatory-read flagging and **read receipts**; employees view and acknowledge from their profile.
- **Company Settings** (`/admin/settings`): company/subscription overview and a tenant→platform **support-ticket** channel.

**Accounting / CT600 (Phase 7 — optional, feature-flagged)**
- Gated by the per-tenant `accounting` feature flag (off by default). The Platform Owner toggles it per company; nav items and pages appear only when enabled, and `requireFeature` guards each route server-side.
- **Financial Accounts** (`/admin/financial`): customers, suppliers, sales invoices, purchase bills, **VAT return** (output − input), P&L and aged receivables/payables.
- **Corporation Tax CT600** (`/admin/ct600`): unit-tested CT engine — small-profits rate (19%), main rate (25%) and **marginal relief** (3/200) with associated-company/short-period limit pro-rating — plus payment (9m+1d) and filing (12m) deadlines.

## Quick start

```bash
# 1. Install
npm install

# 2. Database — use the local Postgres, or docker:
docker compose up -d                # optional; starts Postgres on :5432

# 3. Environment
cp .env.example .env                # then set AUTH_SECRET & ENCRYPTION_KEY
npx auth secret                     # generates AUTH_SECRET
openssl rand -base64 32             # use for ENCRYPTION_KEY (32 bytes, base64)

# 4. Migrate + seed
npm run db:migrate                  # applies prisma/migrations
npm run db:seed                     # demo tenant, roles, users, employees

# 5. Run
npm run dev                         # http://localhost:3000
```

### Demo logins (password: `Password123!`)
| Role | Email |
|---|---|
| HR Admin | `hr@hounslow.co.uk` |
| Manager | `manager@hounslow.co.uk` |
| Employee | `employee@hounslow.co.uk` |
| External | `accountant@external.co.uk` |
| Platform Owner | `owner@complihr.co.uk` |

## Scripts
| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm run db:migrate` | Create & apply a migration (dev) |
| `npm run db:deploy` | Apply migrations (prod/CI) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |
| `npm run db:generate` | Regenerate Prisma client |

## Architecture map
```
src/
  app/               routes: / (marketing) · /admin · /manager · /me · /external · /owner
  auth.ts            Auth.js server config (credentials)
  proxy.ts           route protection (Next 16 "proxy" = middleware)
  lib/
    db/prisma.ts     Prisma 7 client (pg driver adapter)
    auth/            session helpers, edge-safe config
    authz/           permission matrix + ability
    actions/guard.ts guarded Server Action pipeline (authz + zod + audit)
    services/        tenant-scoped data access
    validation/      UK + entity Zod schemas
    crypto.ts        PII field encryption
  components/        ui/ (kit), shell/ (sidebar/topbar), shared/
prisma/              schema.prisma, migrations/, seed.ts
```

## Supabase migration
The schema is Supabase-Postgres compatible. To cut over: point `DATABASE_URL` at Supabase,
run `npm run db:deploy`, enable RLS policies (`tenant_id = auth.jwt()->>'tenant_id'`), and switch
the storage/env config. See the migration section of the architecture doc.
# BritishHR
