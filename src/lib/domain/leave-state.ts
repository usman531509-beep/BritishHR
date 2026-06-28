import type { LeaveRequestStatus } from "@prisma/client";

// Leave request lifecycle. Transitions are the single source of truth used by
// the Server Actions; the UI only offers actions that `canTransition` allows.
export type LeaveAction = "submit" | "approve" | "reject" | "cancel" | "markTaken";

const TRANSITIONS: Record<LeaveAction, { from: LeaveRequestStatus[]; to: LeaveRequestStatus }> = {
  submit: { from: ["draft"], to: "pending" },
  approve: { from: ["pending"], to: "approved" },
  reject: { from: ["pending"], to: "rejected" },
  // Employees can cancel a pending request; HR/managers can cancel an approved one.
  cancel: { from: ["draft", "pending", "approved"], to: "cancelled" },
  markTaken: { from: ["approved"], to: "taken" },
};

export function canTransition(current: LeaveRequestStatus, action: LeaveAction): boolean {
  return TRANSITIONS[action].from.includes(current);
}

export function nextStatus(current: LeaveRequestStatus, action: LeaveAction): LeaveRequestStatus {
  const t = TRANSITIONS[action];
  if (!t.from.includes(current)) {
    throw new Error(`Cannot ${action} a request that is ${current}`);
  }
  return t.to;
}

// Statuses that consume balance (booked vs taken).
export const PENDING_STATUSES: LeaveRequestStatus[] = ["pending"];
export const CONSUMED_STATUSES: LeaveRequestStatus[] = ["approved", "taken"];
