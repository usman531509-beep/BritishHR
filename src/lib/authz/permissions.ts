import { RoleKey } from "@prisma/client";

// Permission keys are "module:action". Actions: view, create, edit, approve,
// delete, export, admin. The matrix below is the source of truth seeded into
// the database (role_permissions) and is also used for in-memory checks.

export const MODULES = [
  "dashboard",
  "employee",
  "department",
  "team",
  "jobtitle",
  "org",
  "contract",
  "document",
  "leave",
  "attendance",
  "payroll",
  "recruitment",
  "onboarding",
  "compliance",
  "immigration",
  "performance",
  "expense",
  "messaging",
  "report",
  "audit",
  "tenant",
  "user",
  "billing",
  "support",
  "accounting",
] as const;

export type Module = (typeof MODULES)[number];
export type Action =
  | "view"
  | "create"
  | "edit"
  | "approve"
  | "delete"
  | "export"
  | "admin";

export type PermissionKey = `${Module}:${Action}`;

export function perm(module: Module, action: Action): PermissionKey {
  return `${module}:${action}`;
}

// Convenience: expand a module to a set of actions.
const FULL: Action[] = ["view", "create", "edit", "approve", "delete", "export", "admin"];
const RW: Action[] = ["view", "create", "edit"];
const RO: Action[] = ["view"];
const RO_EXPORT: Action[] = ["view", "export"];

function build(map: Partial<Record<Module, Action[]>>): PermissionKey[] {
  const out: PermissionKey[] = [];
  for (const [m, actions] of Object.entries(map)) {
    for (const a of actions as Action[]) out.push(perm(m as Module, a));
  }
  return out;
}

// Phase 0/1 role → permissions. Later phases extend the per-module actions.
export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  PLATFORM_OWNER: build({
    tenant: FULL,
    billing: FULL,
    user: FULL,
    report: RO_EXPORT,
    audit: RO,
    dashboard: RO,
  }),
  HR_ADMIN: build({
    dashboard: RO,
    employee: FULL,
    department: FULL,
    team: FULL,
    jobtitle: FULL,
    org: FULL,
    contract: FULL,
    document: FULL,
    leave: FULL,
    attendance: FULL,
    payroll: FULL,
    recruitment: FULL,
    onboarding: FULL,
    compliance: FULL,
    immigration: FULL,
    performance: FULL,
    expense: FULL,
    messaging: FULL,
    accounting: FULL,
    report: RO_EXPORT,
    audit: RO,
    user: RW,
    support: RW,
  }),
  MANAGER: build({
    dashboard: RO,
    employee: ["view", "edit"],
    org: RO,
    leave: ["view", "approve"],
    attendance: RW,
    document: RO,
    onboarding: ["view", "edit"],
    performance: RW,
    expense: ["view", "approve"],
    messaging: RO,
    report: RO,
  }),
  EMPLOYEE: build({
    dashboard: RO,
    employee: RO, // self only — enforced by ownership check
    leave: ["view", "create"],
    attendance: ["view", "create"],
    document: RO,
    onboarding: ["view", "edit"],
    expense: ["view", "create"],
    messaging: RO,
  }),
  EXTERNAL: build({
    dashboard: RO,
    compliance: RO_EXPORT,
    payroll: RO_EXPORT,
    accounting: RO_EXPORT,
    audit: RO,
    report: RO_EXPORT,
    document: RO,
  }),
};
