"use client";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import { cancelLeave } from "@/lib/actions/leave-actions";

export function CancelButton({ id }: { id: string }) {
  return (
    <ConfirmModal
      title="Cancel this leave request?"
      description="This withdraws your request. You can submit a new one if you change your mind."
      confirmLabel="Cancel request"
      successMessage="Leave request cancelled"
      onConfirm={() => cancelLeave({ id })}
      trigger={
        <button className="text-xs font-medium text-danger hover:underline">
          Cancel
        </button>
      }
    />
  );
}
