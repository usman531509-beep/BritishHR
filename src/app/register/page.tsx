import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

export const metadata = { title: "Start a trial — CompliHR UK" };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-surface p-8 shadow-lg">
        <Link href="/" className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-sky-400 to-brand font-extrabold text-white">C</span>
          <span className="font-display text-lg font-extrabold">CompliHR UK</span>
        </Link>
        <h1 className="font-display text-2xl font-extrabold">Start your free trial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Company self-onboarding is provisioned through the Platform Owner console (Phase 6).
          For now, explore the product with the demo accounts.
        </p>
        <div className="mt-6 space-y-4 opacity-60">
          <Field label="Company name"><Input placeholder="Acme Ltd" disabled /></Field>
          <Field label="Work email"><Input placeholder="you@company.co.uk" disabled /></Field>
        </div>
        <Link href="/login" className="mt-6 block">
          <Button className="w-full">Explore the demo instead</Button>
        </Link>
      </div>
    </div>
  );
}
