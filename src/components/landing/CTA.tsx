import { Reveal } from "./Reveal";

export function CTA() {
  return (
    <section id="cta" className="relative mx-auto max-w-7xl px-6 py-24">
      <Reveal
        direction="right"
        className="relative overflow-hidden rounded-[32px] glass-strong px-8 py-16 md:px-16 md:py-24"
        distance={40}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(60% 80% at 0% 50%, rgba(139,92,246,0.18), transparent 70%), radial-gradient(50% 80% at 100% 0%, rgba(34,211,238,0.16), transparent 70%)",
          }}
        />
        <div className="relative max-w-3xl">
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Run UK HR,
            <br />
            <span className="text-foreground">the compliant way.</span>
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-foreground/65">
            Get the entire CompliHR platform free for 14 days. No credit card, UK-hosted and GDPR-compliant.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Start free trial
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </a>
            <a
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-full glass px-7 text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/[0.08]"
            >
              Book a demo
            </a>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-2 text-xs text-foreground/50">
            <span className="inline-flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-emerald-400" /> GDPR compliant
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-emerald-400" /> UK-hosted
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-emerald-400" /> 2024/25 PAYE engine
            </span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
