"use client";

import { Trash2 } from "lucide-react";
import { ConfirmModal } from "./confirm-modal";
import type { ActionResult } from "@/lib/actions/guard";

/**
 * Generic delete control: renders a trash icon (or custom trigger) that opens a
 * confirmation dialog and calls `action({ id })`. Server pages can pass a
 * server-action reference + id directly.
 */
export function ConfirmDeleteButton({
  action,
  id,
  title,
  description,
  confirmLabel = "Delete",
  successMessage = "Deleted",
  trigger,
}: {
  action: (input: { id: string }) => Promise<ActionResult<unknown>>;
  id: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  successMessage?: string;
  trigger?: React.ReactNode;
}) {
  return (
    <ConfirmModal
      trigger={
        trigger ?? (
          <button
            type="button"
            aria-label="Delete"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        )
      }
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      successMessage={successMessage}
      onConfirm={() => action({ id })}
    />
  );
}
