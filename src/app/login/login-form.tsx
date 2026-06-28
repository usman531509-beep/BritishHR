"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

const DEMO = [
  { label: "HR Admin", email: "hr@hounslow.co.uk" },
  { label: "Manager", email: "manager@hounslow.co.uk" },
  { label: "Employee", email: "employee@hounslow.co.uk" },
  { label: "External", email: "accountant@external.co.uk" },
  { label: "Owner", email: "owner@complihr.co.uk" },
];

const fieldClass =
  "h-11 w-full rounded-xl border border-foreground/12 bg-foreground/[0.04] px-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/40 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/go";
  const [email, setEmail] = useState("hr@hounslow.co.uk");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-foreground/70">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={fieldClass}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="block text-xs font-medium text-foreground/70">
            Password
          </label>
          <span className="text-xs text-foreground/40">Forgot?</span>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={fieldClass}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-violet-600 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)] transition-colors hover:bg-violet-500 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Sign in
      </button>

      <div className="rounded-2xl glass p-3">
        <p className="mb-2 text-xs font-medium text-foreground/55">
          Demo accounts (password: Password123!)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword("Password123!");
              }}
              className="rounded-full border border-foreground/10 bg-foreground/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/70 transition-colors hover:border-violet-500/50 hover:text-foreground"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
