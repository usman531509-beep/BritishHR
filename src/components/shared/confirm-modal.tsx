"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/guard";

/**
 * Reusable confirmation dialog for destructive actions.
 *
 *   <ConfirmModal
 *     trigger={<button>Delete</button>}
 *     title="Delete department?"
 *     description="This can't be undone."
 *     onConfirm={() => deleteDepartment({ id })}
 *   />
 */
export function ConfirmModal({
  trigger,
  title,
  description,
  confirmLabel = "Delete",
  successMessage = "Done",
  destructive = true,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  successMessage?: string;
  destructive?: boolean;
  onConfirm: () => Promise<ActionResult<unknown>>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function run() {
    setLoading(true);
    const res = await onConfirm();
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(successMessage);
    setOpen(false);
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              run();
            }}
            className={cn(destructive && "bg-danger text-white hover:bg-danger/90")}
          >
            {loading ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
