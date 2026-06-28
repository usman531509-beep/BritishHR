# CompliHR UK — Analysis, Architecture & Implementation Plan

> Foundation: `complihR_responsive (5).html` (5,414 lines, single-file static prototype)
> Target: Production-grade, enterprise, UK-focused HR platform on **Next.js (App Router) + TypeScript + Tailwind + PostgreSQL**
> Status: **Planning deliverable — no application code generated yet (awaiting sign-off)**

---

## 1. Analysis of the Existing Prototype

### 1.1 What it is
A single self-contained `index.html` (~460 KB) using inline `<style>` and inline `<script>` (ES5-style vanilla JS). It is a **clickable visual mockup**, not an application:

- **No backend, no database, no API, no auth, no persistence.**
- Navigation is `display:none/active` page-switching (`showPage`, `navTab`, `navSub`).
- ~313 `alert()` calls and static-HTML modals stand in for real actions.
- All data is hardcoded sample data (e.g. "Mir Azmath Sultan", "Acme Corporation Ltd").
- Styling is hand-rolled CSS with CSS variables, 6 colour themes, responsive breakpoints, a mobile bottom bar, and a global command-palette search over a static index.

### 1.2 Information architecture (as built)
**Marketing/auth pages:** `home`, `features`, `pricing`, `login`, `register`.

**Five role dashboards** (this is the core insight — it is multi-tenant SaaS):

| Role (prototype id) | Intended user | Scope |
|---|---|---|
| `dashboard-owner` | **Platform Owner** | SaaS operator: companies, subscriptions, payments, accounts, support tickets, system |
| `dashboard-admin` | **Company Admin / HR** | Full HR + payroll + accounting + UK compliance for one company |
| `dashboard-manager` | **Line Manager** | Team approvals, attendance, rota, reports, documents |
| `dashboard-employee` | **Employee (self-service)** | Profile, leave, payslips, docs, training, benefits, visa, onboarding |
| `dashboard-external` | **External (accountant/solicitor)** | Read-mostly: compliance, payroll, audit |

### 1.3 Module inventory (extracted from the prototype)
**Admin dashboard tabs (23):** Overview, Recruitment, Onboarding, Employees, Calendar, Leave & Absence, Attendance & Rota, Payroll, Financial Accounts, Tax Return CT600, Pension, Expenses & Benefits, Messaging, HR Forms, Immigration, Health & Safety, Company Assets, Documents, Compliance Intelligence, AI Assistant, Company Profile, Employer Settings, Director Profile.

These expand into **~230 sub-views** (extracted `sub-*` ids), grouped:

- **Employees:** list, departments, org chart, history, contracts, probation, references, DBS, skills, training, performance, discipline, grievance, offboarding, rates, PAYE/RTI, bank, additions, savings, resources, client-assignment.
- **Leave/Absence:** entitlement, accrual, types, pending, sick/SSP, fit notes, Bradford Factor, maternity/paternity/adoption/shared parental, bereavement, dependant, jury, religious, sabbatical, TOIL, RTW.
- **Attendance/Rota:** today, timesheets, WTD, breaks, late, geo/GPS, mileage, on-call, multi-site, rota, shift library, swaps, open shifts.
- **Payroll:** PAYE, NI, RTI, BACS, payslips, P32, statutory pay, pension, holiday pay, bonus, allowance, salary sacrifice, attachments of earnings, student loan, IR35, apprenticeship levy, director, year-end, reports, forms.
- **Pension (auto-enrolment):** eligibility, enrolment, opt-out, postpone, re-enrolment, provider, rates, salary sacrifice, allowance, docs.
- **Compliance Intelligence:** GDPR, Right-to-Work, equality, HMRC/PAYE, HSE, RIDDOR, modern slavery, bribery, cyber, IR35, NMW, WTD, risk, alerts, score, feed, training.
- **Immigration/sponsorship:** RTW, visa, BRP, CoS, SMS, sponsor licence, ratings, salary thresholds, English, eligibility, audit, reporting, workers, visitors, ATAS.
- **Recruitment/ATS:** pipeline, applications, interviews, offers, references, DBS, identity, RTW, qualifications, occupational health, professional registrations.
- **Documents:** library, contracts, handbook, policies, H&S policies, statutory, payslips, insurance, expiry, retention, version control, e-signature, testing.
- **Expenses & Benefits:** mileage, P11D, PSA, trivial, WFH, childcare, cycle-to-work, medical, company car, share schemes, season ticket, party.
- **Messaging:** inbox/sent, compose, templates, scheduled, announcements, mandatory-read, read-receipts, departmental, group, surveys, newsletter, SMS, WhatsApp, push, auto, translate, e-signature.
- **HR Forms:** starter, leaver, absence, disciplinary, flexible-working, performance, H&S, other, submitted.
- **Health & Safety:** accident book, near-miss, RIDDOR, risk assessments, actions.
- **Assets:** register, issued, returns.
- **Finance/Accounting (beyond pure HR):** overview, P&L, balance sheet, cashflow, invoices, POs, customers, suppliers, VAT, aged debt, bank, budget, Companies House, fixed assets.
- **Tax CT600:** main/marginal rates, deadlines, QIP, losses, group relief, R&D, capital allowances, iXBRL, supplementary pages.

### 1.4 Strengths to preserve
- **Excellent domain modelling for the UK** — SSP/SMP/SPP/SAP, RTI, P32/P11D/P60/P45, auto-enrolment, RIDDOR, Bradford Factor, RTW/CoS/sponsor licence, IR35, NMW, WTD, GDPR retention. This is genuinely valuable, hard-won UK domain knowledge.
- **Clear role separation** and a sensible navigation hierarchy (tab → sub-tab).
- **Coherent visual language** (tokens, themes, responsive shell, command palette).
- **Realistic workflows** implied by the forms (starter/leaver, leave request → approval, recruitment pipeline).

---

## 2. Current Features vs. Missing Features

### 2.1 Current features (functionally present, even if mocked)
- Visual dashboards for 5 roles; tab/sub-tab navigation; responsive + mobile bottom bar.
- 6 theme presets, UI zoom, global search palette.
- ~103 form modals (add employee, leave request, payroll forms, candidate, asset, department, rates, bank, etc.).
- Rendered calendars (admin + employee), simple month nav.
- Static representations of every module listed above.

### 2.2 Missing functionality (everything that makes it real)
**Foundational (blocking):**
- Authentication & session management; password reset; MFA; SSO.
- Persistence — no database; nothing is saved.
- API layer; server-side validation; error handling.
- **Multi-tenancy** — the owner/company model is implied but not enforced (no tenant isolation).
- **RBAC** — roles are just different HTML pages; no permission enforcement.
- Audit logging / activity tracking (referenced in UI, not implemented).
- File storage for documents/contracts/payslips.
- Real e-signature, real notifications/email/SMS, real exports (PDF/CSV).

**Workflow gaps:**
- No state machines (leave request lifecycle, onboarding checklist progress, recruitment stage transitions, disciplinary case flow, offboarding).
- No approval routing (manager → HR escalation, delegation, out-of-office).
- No data validation rules (NI number format, UTR, postcode, date ranges, entitlement caps).
- No calculations engine (holiday entitlement accrual, SSP/SMP, Bradford Factor scoring, pro-rata, FTE).
- No scheduling/automation (RTI submission reminders, visa-expiry alerts, re-enrolment dates, document retention purges).

**Compliance/data-protection gaps:**
- No GDPR mechanics: consent records, DSAR fulfilment, right-to-erasure, retention enforcement, lawful-basis tracking.
- No encryption of sensitive PII (NI numbers, bank details, health/visa data — UK special-category data).
- No immutable audit trail for compliance evidence.

**Quality/scale gaps:**
- Inline ES5 with global functions → unmaintainable, no type safety, no tests.
- 460 KB single document → poor performance, no code-splitting, no caching.
- No accessibility guarantees (ARIA, keyboard nav, focus management) — `alert()`-driven.
- Emoji used as semantic icons; no proper icon system.

### 2.3 Design flaws
- Business-logic and presentation fully entangled in markup.
- Navigation depends on DOM ordering (`querySelectorAll(...)[3].click()`) — brittle.
- No separation of tenant data; finance/accounting + corporation tax bundled into "HR" (scope creep — see §11 Q for decision).

---

## 3. Recommended Improvements (high level)
1. Re-platform to **Next.js App Router + TypeScript + Tailwind** with server components and route-level code splitting.
2. Introduce **PostgreSQL + Prisma** with strict multi-tenant isolation and Row-Level-Security-ready schema (clean Supabase path).
3. Real **auth (Auth.js / NextAuth)** with RBAC + tenant scoping enforced in middleware and a server-side authorization layer.
4. Encode workflows as **explicit state machines** with audit trails.
5. Build a **UK calculations/compliance engine** (entitlement, statutory pay, Bradford, NMW checks, retention) as pure, unit-tested TS modules.
6. **GDPR-by-design**: special-category data encryption, consent & lawful-basis records, DSAR/erasure tooling, retention scheduler.
7. Reusable **design system** (shadcn/ui + Tailwind tokens migrated from the prototype's palette/themes) with full a11y.
8. **Observability**: structured logging, immutable audit log, activity feed, error tracking.
9. **Scope decision**: keep accounting/CT600 as a *separate optional module* behind a feature flag (recommended) rather than core HR.

---

## 4. Target Architecture (Next.js)

### 4.1 Stack
- **Framework:** Next.js (latest, App Router, Server Components, Server Actions for mutations).
- **Language:** TypeScript (strict).
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives) + lucide icons; theming via CSS variables (port the prototype's 6 themes).
- **Data:** PostgreSQL via **Prisma** (dev parity with Supabase Postgres). Zod for runtime validation at every boundary.
- **Auth:** Auth.js (NextAuth v5) — credentials + OAuth/SSO ready; session JWT carries `userId`, `tenantId`, `roles`.
- **Authorization:** central policy module (CASL-style ability or hand-rolled permission map) checked in Server Actions / Route Handlers.
- **Background jobs:** queue abstraction (e.g. pg-boss in dev → Vercel Cron / queue in prod) for alerts, RTI reminders, retention purges.
- **Files:** storage abstraction (local/dev → Supabase Storage / S3) with signed URLs.
- **State (client):** TanStack Query for server-state, React Hook Form + Zod for forms, nuqs for URL state.
- **Testing:** Vitest (unit, esp. UK calc engine), Playwright (e2e), Testing Library.
- **Tooling:** ESLint, Prettier, Turbopack, Husky pre-commit.

### 4.2 Architectural patterns
- **Layered, modular monolith** organised by domain module (not by technical layer) for cohesion and future extraction.
- **Multi-tenant by `tenant_id`** on every business table; every query is tenant-scoped via a request-bound Prisma client / middleware guard. RLS-ready for Supabase.
- **Server-first**: data fetching in RSC, mutations via Server Actions with Zod validation + authorization guard + audit write.
- **Pure domain logic** (UK calculations, state-machine transitions) isolated in `/lib/domain/*` — framework-agnostic, fully unit-tested.

---

## 5. Folder Structure

```
complihr/
├─ app/
│  ├─ (marketing)/                 # home, features, pricing
│  ├─ (auth)/login, register, reset
│  ├─ (platform)/owner/...         # Platform Owner area
│  ├─ (app)/[tenant]/              # tenant-scoped app shell
│  │  ├─ admin/                    # HR/Admin module routes
│  │  │  ├─ employees/ leave/ attendance/ payroll/ recruitment/
│  │  │  ├─ onboarding/ documents/ compliance/ immigration/ ...
│  │  ├─ manager/                  # approvals, rota, attendance, reports
│  │  ├─ me/                       # employee self-service
│  │  └─ external/                 # accountant/solicitor read views
│  └─ api/                         # route handlers (webhooks, exports, files)
├─ components/
│  ├─ ui/                          # shadcn primitives
│  ├─ shared/                      # DataTable, FormModal, Calendar, StatCard...
│  └─ modules/                     # module-specific composite components
├─ lib/
│  ├─ auth/                        # authjs config, session, guards
│  ├─ authz/                       # RBAC ability/permission map
│  ├─ db/                          # prisma client, tenant scoping
│  ├─ domain/                      # UK engines: entitlement, statutory-pay,
│  │                               #   bradford, payroll, retention, state-machines
│  ├─ validation/                  # zod schemas (NI, UTR, postcode, dates)
│  └─ services/                    # use-cases per module (server-side)
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ tests/ (unit, e2e)
└─ ...config
```

---

## 6. Database Design

### 6.1 Principles
- Every business table carries `tenant_id` (FK → `tenants`) + `created_at`, `updated_at`, soft-delete `deleted_at`.
- UK special-category data (NI number, bank, health, visa, equality) stored **encrypted at rest** (pgcrypto / app-level envelope) and access-audited.
- Enums for fixed domains; `CHECK` constraints for ranges; partial unique indexes for tenant scoping.
- **RLS-ready**: schema designed so Supabase Row-Level-Security policies (`tenant_id = auth.jwt()->>'tenant_id'`) can be enabled with zero structural change.
- All money in integer **pence**; all dates `date`/`timestamptz` (UTC); tax years modelled explicitly.

### 6.2 Core table groups (~50 tables)
- **Tenancy & auth:** `tenants`, `subscriptions`, `plans`, `invoices`, `users`, `accounts`, `sessions`, `roles`, `user_roles`, `permissions`, `role_permissions`, `audit_logs`, `activity_events`, `notifications`.
- **Org:** `companies`, `sites`, `departments`, `teams`, `job_titles`, `positions`, `org_assignments`.
- **People:** `employees`, `employment_contracts`, `employment_history`, `employee_bank_details`(enc), `right_to_work`, `visas`(enc), `equality_records`(enc), `next_of_kin`, `documents`, `document_versions`, `document_signatures`, `retention_policies`.
- **Leave & absence:** `leave_types`, `leave_entitlements`, `leave_requests`, `leave_balances`, `absences`, `sickness_records`, `fit_notes`, `bradford_scores`, `statutory_leave_claims`.
- **Time:** `shifts`, `shift_templates`, `rotas`, `rota_assignments`, `timesheets`, `clock_events`, `breaks`, `toil_balances`.
- **Recruitment/onboarding/offboarding:** `vacancies`, `candidates`, `applications`, `interviews`, `offers`, `references`, `onboarding_checklists`, `onboarding_tasks`, `offboarding_cases`.
- **Performance/development:** `objectives`, `reviews`, `kpis`, `training_courses`, `training_records`, `certifications`, `skills`.
- **Cases:** `disciplinary_cases`, `grievance_cases`, `case_events`.
- **Payroll/benefits (preparation):** `pay_runs`, `payslips`, `pay_elements`, `pension_schemes`, `pension_enrolments`, `expense_claims`, `benefits`, `p11d_records`.
- **Compliance/H&S:** `compliance_items`, `compliance_alerts`, `risk_assessments`, `accidents`, `riddor_reports`, `consents`, `dsar_requests`.
- **Assets:** `assets`, `asset_assignments`.

### 6.3 Representative DDL (illustrative; full set in migrations)
```sql
CREATE TABLE tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  companies_house_no text,
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('trial','active','suspended','cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE employment_status AS ENUM
  ('applicant','onboarding','active','on_leave','suspended','offboarding','left');

CREATE TABLE employees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id),
  payroll_ref     text,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  ni_number_enc   bytea,                         -- encrypted, validated NI format on input
  dob             date,
  start_date      date NOT NULL,
  end_date        date,
  status          employment_status NOT NULL DEFAULT 'onboarding',
  department_id   uuid REFERENCES departments(id),
  job_title_id    uuid REFERENCES job_titles(id),
  manager_id      uuid REFERENCES employees(id),
  fte             numeric(4,3) NOT NULL DEFAULT 1.000 CHECK (fte > 0 AND fte <= 1),
  annual_salary_pence bigint CHECK (annual_salary_pence >= 0),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (tenant_id, payroll_ref)
);
CREATE INDEX idx_employees_tenant       ON employees(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_tenant_dept  ON employees(tenant_id, department_id);
CREATE INDEX idx_employees_manager      ON employees(manager_id);

CREATE TYPE leave_request_status AS ENUM
  ('draft','pending','approved','rejected','cancelled','taken');

CREATE TABLE leave_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id   uuid NOT NULL REFERENCES employees(id),
  leave_type_id uuid NOT NULL REFERENCES leave_types(id),
  start_date    date NOT NULL,
  end_date      date NOT NULL,
  days          numeric(5,2) NOT NULL CHECK (days > 0),
  status        leave_request_status NOT NULL DEFAULT 'pending',
  approver_id   uuid REFERENCES employees(id),
  decided_at    timestamptz,
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX idx_leave_tenant_emp_status ON leave_requests(tenant_id, employee_id, status);

CREATE TABLE audit_logs (                       -- immutable, append-only
  id          bigserial PRIMARY KEY,
  tenant_id   uuid NOT NULL,
  actor_id    uuid,
  action      text NOT NULL,                     -- e.g. 'employee.update'
  entity      text NOT NULL,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  ip          inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);
```

### 6.4 Migration strategy
- Prisma Migrate as source of truth; one migration per cohesive change; `seed.ts` ports the prototype's sample data for realistic demos.
- Generated SQL kept in `prisma/migrations` so it can be applied directly to Supabase.

---

## 7. API Architecture
- **Server Actions** for tenant-internal mutations (create/update leave, approve, etc.) — co-located, typed, validated with Zod, guarded by authz, and audit-logged via a single `withGuard()` wrapper.
- **Route Handlers (`app/api`)** only for: webhooks (payments, e-sign), file upload/download (signed URLs), exports (PDF/CSV), cron endpoints, and any external integrations.
- **Standard envelope:** `{ data, error, meta }`; consistent error codes; never leak cross-tenant data.
- **Every entry point passes through:** `authenticate → resolve tenant → authorize (RBAC) → validate (Zod) → execute service → audit → respond`.

---

## 8. RBAC — Roles & Permissions Matrix

Six base roles (extends the prototype's five with a Super/Tenant-Admin split). Permissions are `module:action` (`view`, `create`, `edit`, `approve`, `delete`, `export`, `admin`), evaluated with tenant scope.

| Module / Capability | Platform Owner | HR Admin | Manager | Employee | External (Acct/Sol) |
|---|---|---|---|---|---|
| Tenant/company mgmt, billing | **Full** | own company profile | – | – | – |
| Users & roles | platform users | tenant users | – | – | – |
| Employee records | – (no PII) | **Full** | team: view/edit limited | self: view | view (scoped) |
| Leave & absence | – | **Full** | approve team | request/own | view |
| Attendance & rota | – | **Full** | manage team rota | own clock/timesheet | – |
| Payroll | – | **Full** | view team summary | own payslips | view/export |
| Recruitment/ATS | – | **Full** | interview/feedback | – | – |
| Onboarding/offboarding | – | **Full** | tasks for team | own tasks | – |
| Documents | – | **Full** | team docs | own + signed | view (scoped) |
| Compliance & immigration | – | **Full** | alerts (team) | own RTW/visa | view/export |
| Performance/training | – | **Full** | team reviews/objectives | own | – |
| Disciplinary/grievance | – | **Full** | initiate/view (team) | own grievance | – |
| Expenses/benefits | – | **Full** | approve team | own claims | view |
| Reporting & analytics | platform-wide | tenant-wide | team-scoped | self | scoped/export |
| Audit logs | platform | tenant | – | – | view (scoped) |

*Permissions are data-driven (`roles`/`permissions` tables) so tenants can define custom roles later.*

---

## 9. UI/UX Redesign Recommendations
- **Preserve the brand:** port the dark-navy + cyan palette and 6 accent themes into Tailwind/CSS-variable tokens; keep dark mode.
- **Replace emoji-as-icons** with lucide for consistency and accessibility.
- **Real components:** `DataTable` (sort/filter/paginate/export), `FormModal` (RHF+Zod), `Calendar`, `StatCard`, `Timeline`, `ApprovalCard`, `Stepper` (onboarding/recruitment), command palette (keep, wire to real routes).
- **Accessibility:** WCAG 2.2 AA — ARIA, focus management, keyboard nav, no `alert()`-driven UX (use toasts/dialogs), proper contrast.
- **Responsive shell:** keep the mobile bottom bar and collapsible sidebar, rebuilt as components.
- **Empty/loading/error states** everywhere (skeletons via RSC + Suspense).
- **Performance:** route-level code splitting, server components by default, streaming, image optimisation, font subsetting (Inter/Sora already chosen).

---

## 10. Development Roadmap (phased)

**Phase 0 — Foundation (scaffold).** Next.js+TS+Tailwind+shadcn, Prisma+Postgres, Auth.js, tenant model, RBAC core, audit log, app shell + theming, CI, seed data.

**Phase 1 — People core.** Employees, departments/teams/job titles, org structure, contracts, documents + storage, employee self-service profile.

**Phase 2 — Leave & Time.**
- *2a (DONE):* Leave types/entitlement engine (5.6wk/28-day cap, FTE & part-year pro-rata), leave requests + approval state machine, absence/sickness, Bradford Factor, leave calendar.
- *2b (DONE):* Attendance/timesheets, clock-in/out, Working Time Directive 48h checks, rota & shift scheduling.

**Phase 3 — Lifecycle.**
- *DONE:* Recruitment/ATS pipeline (Kanban + stage state machine + offers), onboarding checklists from a UK default template with progress tracking.
- *Next:* Offboarding checklists, performance/objectives, training/certifications.

**Phase 4 — UK Compliance.** *(DONE)* Right-to-Work register & checks, immigration/visa tracking + sponsor licence, GDPR (DSAR with statutory deadline, consent register, retention), equality & diversity (encrypted, anonymised aggregation), compliance dashboard & alerts engine with score, H&S risk assessments & RIDDOR accident book.

**Phase 5 — Payroll prep & Benefits.** *(DONE)* UK payroll engine (PAYE + PA taper, Class 1 NI ee/er, pension qualifying earnings, student loan, SSP/SMP/SPP — unit-tested), pay runs generating payslips, pension auto-enrolment, employee payslips, expense claims with approval, benefits-in-kind/P11D with Class 1A. *Next:* RTI/FPS export, payslip PDF, P60/P45.

**Phase 6 — Platform & Insights.** *(DONE)* Platform-owner SaaS console (companies portfolio, company provisioning, subscriptions/plans/invoices, MRR, cross-tenant support tickets), reporting & analytics with charts, messaging/announcements with read receipts, company-settings + tenant support channel.

**Phase 7 — Optional Accounting module** (CT600/finance) behind the `accounting` feature flag. *(DONE)* Customers/suppliers, sales invoices & purchase bills, VAT return, P&L, aged debt; CT600 corporation-tax computation (SPR/main/marginal relief, tested) with payment & filing deadlines. Per-tenant flag toggled by the Platform Owner; nav + routes gated by `requireFeature`.

Cross-cutting throughout: tests (esp. domain engines), audit/observability, a11y, performance budgets.

---

## 11. Supabase Migration Strategy
- **Dev parity now:** use Postgres locally (Docker) — identical engine to Supabase, so the schema, types, and Prisma migrations transfer unchanged.
- **Auth:** Auth.js works with Supabase Postgres directly; if later adopting Supabase Auth, map `auth.users` → `users` and move session issuance — kept behind the `lib/auth` boundary so it's a localized change.
- **RLS:** schema already carries `tenant_id` everywhere; enabling Supabase RLS = adding policies (`tenant_id = (auth.jwt()->>'tenant_id')::uuid`) without structural change.
- **Storage:** the file-storage interface (`lib/services/storage`) swaps local → Supabase Storage by config.
- **Realtime (optional later):** notifications/activity feed can subscribe to Supabase Realtime channels with no schema change.
- **Cutover:** point `DATABASE_URL` to Supabase, run `prisma migrate deploy`, enable RLS policies, switch storage env — no application rewrite.

---

## 12. Decisions to Confirm Before Building
1. **Accounting/CT600 scope** — keep as optional flagged module (recommended) vs. core?
2. **Auth approach** — Auth.js credentials now (recommended), or go straight to Supabase Auth / Clerk?
3. **Multi-tenancy depth** — full Platform-Owner SaaS console in v1, or single-tenant first and add the owner layer in Phase 6?
4. **Build order** — start Phase 0 + Phase 1 (foundation + people core) as the first deliverable?
```
