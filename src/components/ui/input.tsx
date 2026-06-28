import * as React from "react"

import { cn } from "@/lib/utils"

const fieldBase =
  "flex h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 py-1 text-sm shadow-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldBase, "file:border-0 file:bg-transparent file:text-sm file:font-medium", className)} {...props} />
}

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} data-slot="select" className={cn(fieldBase, "appearance-none bg-no-repeat pr-8", className)} {...props} />
  ),
)
Select.displayName = "Select"

function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-foreground", className)} {...props} />
}

function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string
  error?: string
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <div>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  )
}

export { Input, Select, Label, Field }
