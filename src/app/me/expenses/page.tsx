import { Plus } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { listExpenses } from "@/lib/services/payroll";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { formatGBP } from "@/lib/validation/uk";

export default async function MyExpensesPage() {
  const ctx = await requireTenant();
  const claims = ctx.employeeId ? await listExpenses(ctx.tenantId, { employeeId: ctx.employeeId }) : [];

  return (
    <>
      <PageHeader
        title="My Expenses"
        subtitle="Submit and track expense claims"
        action={
          <FormModalLauncher
            formKey="expenseSubmit"
            title="New expense claim"
            description="Submit an expense for approval."
            trigger={<Button><Plus className="h-4 w-4" /> New claim</Button>}
          />
        }
      />
      <div className="grid gap-6">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>My claims</CardTitle></CardHeader>
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {claims.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No claims yet.</td></tr>
                ) : claims.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium">{c.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.category}</td>
                    <td className="px-4 py-3">{formatGBP(c.amountPence)}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(c.status === "approved" || c.status === "paid" ? "approved" : c.status === "rejected" ? "rejected" : "pending")}>{c.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
