import type { ApplicationStage } from "@prisma/client";

// Recruitment pipeline. Forward progression plus reject/withdraw from most stages.
export const PIPELINE_STAGES: ApplicationStage[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
];

const FORWARD: Record<ApplicationStage, ApplicationStage[]> = {
  applied: ["screening", "interview", "rejected", "withdrawn"],
  screening: ["interview", "offer", "rejected", "withdrawn"],
  interview: ["offer", "rejected", "withdrawn"],
  offer: ["hired", "rejected", "withdrawn"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

export function canMoveStage(from: ApplicationStage, to: ApplicationStage): boolean {
  return FORWARD[from]?.includes(to) ?? false;
}

export function isTerminal(stage: ApplicationStage): boolean {
  return stage === "hired" || stage === "rejected" || stage === "withdrawn";
}

/** Stages that should appear as columns on the Kanban board. */
export const BOARD_COLUMNS: ApplicationStage[] = ["applied", "screening", "interview", "offer", "hired"];
