import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGBP } from "@/lib/validation/uk";
import { formatDate } from "@/lib/utils";

interface PayslipLike {
  grossPence: number;
  incomeTaxPence: number;
  employeeNiPence: number;
  employerNiPence: number;
  pensionEmployeePence: number;
  pensionEmployerPence: number;
  studentLoanPence: number;
  netPence: number;
  taxYear: string;
  payRun: { periodLabel: string; payDate: Date };
  employee?: { firstName: string; lastName: string; payrollRef: string | null };
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 text-sm ${strong ? "border-t border-border pt-2 font-bold" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function PayslipDetail({ p }: { p: PayslipLike }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Payslip — {p.payRun.periodLabel}</CardTitle>
        <span className="text-xs text-muted-foreground">Tax year {p.taxYear} · paid {formatDate(p.payRun.payDate)}</span>
      </CardHeader>
      <CardBody>
        {p.employee ? (
          <p className="mb-3 text-sm font-medium">{p.employee.firstName} {p.employee.lastName} {p.employee.payrollRef ? `(${p.employee.payrollRef})` : ""}</p>
        ) : null}
        <div className="grid gap-x-10 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payments</p>
            <Line label="Gross pay" value={formatGBP(p.grossPence)} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deductions</p>
            <Line label="Income Tax (PAYE)" value={formatGBP(p.incomeTaxPence)} />
            <Line label="National Insurance" value={formatGBP(p.employeeNiPence)} />
            {p.pensionEmployeePence > 0 ? <Line label="Pension" value={formatGBP(p.pensionEmployeePence)} /> : null}
            {p.studentLoanPence > 0 ? <Line label="Student loan" value={formatGBP(p.studentLoanPence)} /> : null}
          </div>
        </div>
        <div className="mt-2">
          <Line label="Net pay" value={formatGBP(p.netPence)} strong />
        </div>
        <div className="mt-4 rounded-lg bg-bg/60 p-3 text-xs text-muted-foreground">
          <p className="font-semibold">Employer costs (not deducted from you)</p>
          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
            <span>Employer NI: {formatGBP(p.employerNiPence)}</span>
            {p.pensionEmployerPence > 0 ? <span>Employer pension: {formatGBP(p.pensionEmployerPence)}</span> : null}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
