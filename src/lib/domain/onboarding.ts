import type { OnboardingTaskStatus } from "@prisma/client";

export interface TaskLike {
  status: OnboardingTaskStatus;
}

/** Percentage complete (0–100) for a checklist. */
export function checklistProgress(tasks: TaskLike[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

/** A default UK new-starter onboarding template (used when seeding tenants). */
export const DEFAULT_ONBOARDING_TASKS: {
  title: string;
  category: string;
  ownerRole: string;
  dueOffsetDays: number;
}[] = [
  { title: "Right-to-Work check completed", category: "compliance", ownerRole: "HR_ADMIN", dueOffsetDays: 0 },
  { title: "Signed contract returned", category: "hr", ownerRole: "HR_ADMIN", dueOffsetDays: 0 },
  { title: "P45 / starter checklist received", category: "hr", ownerRole: "HR_ADMIN", dueOffsetDays: 3 },
  { title: "Bank details & NI number collected", category: "hr", ownerRole: "HR_ADMIN", dueOffsetDays: 3 },
  { title: "Pension auto-enrolment assessment", category: "compliance", ownerRole: "HR_ADMIN", dueOffsetDays: 7 },
  { title: "IT account & equipment issued", category: "it", ownerRole: "MANAGER", dueOffsetDays: 0 },
  { title: "Induction & H&S briefing", category: "general", ownerRole: "MANAGER", dueOffsetDays: 1 },
  { title: "Probation objectives set", category: "general", ownerRole: "MANAGER", dueOffsetDays: 7 },
];

export function dueDateFor(startDate: Date, offsetDays: number): Date {
  return new Date(startDate.getTime() + offsetDays * 86_400_000);
}
