import {
  LayoutDashboard,
  Users,
  Building2,
  Network,
  Briefcase,
  CalendarDays,
  Clock,
  Wallet,
  UserPlus,
  Rocket,
  FileText,
  ShieldCheck,
  Plane,
  Megaphone,
  BarChart3,
  Receipt,
  Settings,
  Building,
  CreditCard,
  LifeBuoy,
  Landmark,
  Calculator,
  Tags,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Phase 1 = built; later = placeholder "coming soon". */
  ready?: boolean;
  /** Optional module gate — item is hidden unless the tenant has this feature flag enabled. */
  flag?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// Sidebar per role area. Items without `ready` render a "coming soon" page.
export const NAV: Record<string, NavSection[]> = {
  admin: [
    {
      items: [{ label: "Overview", href: "/admin", icon: LayoutDashboard, ready: true }],
    },
    {
      title: "People",
      items: [
        { label: "Employees", href: "/admin/employees", icon: Users, ready: true },
        { label: "Departments", href: "/admin/departments", icon: Building2, ready: true },
        { label: "Job Titles", href: "/admin/job-titles", icon: Briefcase, ready: true },
        { label: "Org Structure", href: "/admin/org", icon: Network, ready: true },
        { label: "Documents", href: "/admin/documents", icon: FileText, ready: true },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Recruitment", href: "/admin/recruitment", icon: UserPlus, ready: true },
        { label: "Onboarding", href: "/admin/onboarding", icon: Rocket, ready: true },
        { label: "Leave & Absence", href: "/admin/leave", icon: CalendarDays, ready: true },
        { label: "Attendance & Rota", href: "/admin/attendance", icon: Clock, ready: true },
        { label: "Payroll", href: "/admin/payroll", icon: Wallet, ready: true },
        { label: "Expenses", href: "/admin/expenses", icon: Receipt, ready: true },
      ],
    },
    {
      title: "Compliance (UK)",
      items: [
        { label: "Compliance", href: "/admin/compliance", icon: ShieldCheck, ready: true },
        { label: "Immigration & RTW", href: "/admin/immigration", icon: Plane, ready: true },
      ],
    },
    {
      title: "Finance (add-on)",
      items: [
        { label: "Financial Accounts", href: "/admin/financial", icon: Landmark, ready: true, flag: "accounting" },
        { label: "Tax Return CT600", href: "/admin/ct600", icon: Calculator, ready: true, flag: "accounting" },
      ],
    },
    {
      title: "Admin",
      items: [
        { label: "Messaging", href: "/admin/messaging", icon: Megaphone, ready: true },
        { label: "Reports", href: "/admin/reports", icon: BarChart3, ready: true },
        { label: "Company Settings", href: "/admin/settings", icon: Settings, ready: true },
      ],
    },
  ],
  manager: [
    {
      items: [
        { label: "Overview", href: "/manager", icon: LayoutDashboard, ready: true },
        { label: "My Team", href: "/manager/team", icon: Users, ready: true },
        { label: "Approvals", href: "/manager/approvals", icon: ShieldCheck, ready: true },
        { label: "Attendance", href: "/manager/attendance", icon: Clock, ready: true },
        { label: "Rota", href: "/manager/rota", icon: CalendarDays, ready: true },
      ],
    },
  ],
  me: [
    {
      items: [
        { label: "My Profile", href: "/me", icon: Users, ready: true },
        { label: "Timesheet", href: "/me/timesheet", icon: Clock, ready: true },
        { label: "Leave", href: "/me/leave", icon: CalendarDays, ready: true },
        { label: "Onboarding", href: "/me/onboarding", icon: Rocket, ready: true },
        { label: "Payslips", href: "/me/payslips", icon: Wallet, ready: true },
        { label: "Expenses", href: "/me/expenses", icon: Receipt, ready: true },
        { label: "Documents", href: "/me/documents", icon: FileText },
      ],
    },
  ],
  external: [
    {
      items: [
        { label: "Overview", href: "/external", icon: LayoutDashboard, ready: true },
        { label: "Payroll", href: "/external/payroll", icon: Wallet, ready: true },
        { label: "Compliance", href: "/external/compliance", icon: ShieldCheck, ready: true },
      ],
    },
  ],
  owner: [
    {
      items: [
        { label: "Overview", href: "/owner", icon: LayoutDashboard, ready: true },
        { label: "Companies", href: "/owner/companies", icon: Building, ready: true },
        { label: "Pricing plans", href: "/owner/plans", icon: Tags, ready: true },
        { label: "Subscriptions", href: "/owner/subscriptions", icon: CreditCard, ready: true },
        { label: "Support", href: "/owner/tickets", icon: LifeBuoy, ready: true },
      ],
    },
  ],
};

export const ROLE_HOME: Record<string, string> = {
  PLATFORM_OWNER: "/owner",
  HR_ADMIN: "/admin",
  MANAGER: "/manager",
  EMPLOYEE: "/me",
  EXTERNAL: "/external",
};

export function homeForRoles(roles: string[]): string {
  for (const r of ["PLATFORM_OWNER", "HR_ADMIN", "MANAGER", "EXTERNAL", "EMPLOYEE"]) {
    if (roles.includes(r)) return ROLE_HOME[r];
  }
  return "/me";
}
