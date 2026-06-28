"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Reusable create/edit modal. Pass the form as `children`; the modal injects an
 * `onSuccess` callback into it (via cloneElement) that closes the dialog — so
 * this works even when rendered from a server component.
 *
 *   <FormModal trigger={<Button>Add</Button>} title="Add department">
 *     <DeptForm action={createDepartment} />
 *   </FormModal>
 *
 * The child form must accept an optional `onSuccess?: () => void` prop and call
 * it after a successful submit.
 */
export function FormModal({
  trigger,
  title,
  description,
  children,
  className,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactElement<{ onSuccess?: () => void }>;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("max-h-[90vh] overflow-y-auto sm:max-w-lg", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {React.cloneElement(children, { onSuccess: () => setOpen(false) })}
      </DialogContent>
    </Dialog>
  );
}
