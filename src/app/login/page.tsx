import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AnimatedGradient } from "@/components/landing/AnimatedGradient";
import { LogoMark } from "@/components/landing/Logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — CompliHR UK" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <AnimatedGradient />

      <Link
        href="/"
        className="absolute left-5 top-5 inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to home
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="CompliHR UK">
            <LogoMark size={44} />
            <span className="font-display text-xl font-extrabold tracking-tight text-foreground">CompliHR</span>
          </Link>
          <h1 className="mt-7 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            <span className="text-gradient">Welcome back</span>
          </h1>
          <p className="mt-2 text-sm text-foreground/60">Sign in to your CompliHR workspace.</p>
        </div>

        <div className="rounded-3xl glass-strong p-6 shadow-2xl sm:p-8">
          <Suspense fallback={<div className="h-72" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-foreground/60">
          New company?{" "}
          <Link href="/register" className="font-semibold text-violet-500 hover:underline">
            Start a free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
