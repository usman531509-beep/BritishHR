import { BentoCard } from "./BentoCard";
import { Icon3D } from "./Icon3D";
import { Reveal } from "./Reveal";

export function Bento() {
  return (
    <section
      id="features"
      className="relative mx-auto max-w-7xl px-6 py-28 md:py-36"
    >
      <Reveal direction="left">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-foreground/70">
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
          What&apos;s inside
        </div>
        <h2 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Everything UK HR needs, in one connected platform.
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-foreground/60">
          From people and leave to payroll and compliance — turn on what you need and scale into the rest. No spreadsheets, no five separate vendors.
        </p>
      </Reveal>

      <div className="mt-14 grid auto-rows-[minmax(220px,auto)] grid-cols-1 gap-4 md:grid-cols-6">
        <BentoCard className="md:col-span-4 md:row-span-2">
          <div className="flex h-full flex-col">
            <div className="mb-6 flex items-center justify-between">
              <Icon3D name="orbit" />
              <span className="rounded-full glass px-2.5 py-1 text-[10px] uppercase tracking-widest text-foreground/55">
                Core
              </span>
            </div>
            <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Complete employee lifecycle.
            </h3>
            <p className="mt-3 max-w-md text-foreground/60">
              Profiles, contracts, org structure, documents and self-service — from onboarding to offboarding, with a full audit trail.
            </p>
            <div className="mt-auto pt-8">
              <FlowDiagram />
            </div>
          </div>
        </BentoCard>

        <BentoCard className="md:col-span-2">
          <div className="flex h-full flex-col">
            <Icon3D name="bolt" className="mb-5" />
            <h3 className="text-xl font-semibold tracking-tight">
              Leave & absence.
            </h3>
            <p className="mt-2 text-sm text-foreground/60">
              Statutory entitlement, holiday accrual, sickness and the Bradford Factor.
            </p>
            <div className="mt-5">
              <LatencyChart />
            </div>
          </div>
        </BentoCard>

        <BentoCard className="md:col-span-2">
          <div className="flex h-full flex-col">
            <Icon3D name="shield" className="mb-5" />
            <h3 className="text-xl font-semibold tracking-tight">
              UK compliance by default.
            </h3>
            <p className="mt-2 text-sm text-foreground/60">
              GDPR, equality, H&S and Right-to-Work — monitored with live alerts.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-1.5">
              {["GDPR", "RTW", "RIDDOR", "DSAR", "Equality", "WTD"].map(
                (b) => (
                  <span
                    key={b}
                    className="rounded-md border border-foreground/10 bg-foreground/[0.03] px-2 py-1.5 text-center text-[10px] font-medium text-foreground/70"
                  >
                    {b}
                  </span>
                ),
              )}
            </div>
          </div>
        </BentoCard>

        <BentoCard className="md:col-span-3">
          <div className="flex h-full flex-col">
            <div className="mb-5 flex items-center gap-3">
              <Icon3D name="globe" />
              <span className="text-[11px] uppercase tracking-widest text-foreground/45">
                Payroll
              </span>
            </div>
            <h3 className="text-xl font-semibold tracking-tight">
              Payroll, PAYE & pensions.
            </h3>
            <p className="mt-2 text-sm text-foreground/60">
              PAYE, National Insurance and pension auto-enrolment on the 2024/25 engine.
            </p>
            <RegionMap />
          </div>
        </BentoCard>

        <BentoCard className="md:col-span-3">
          <div className="flex h-full flex-col">
            <Icon3D name="chip" className="mb-5" />
            <h3 className="text-xl font-semibold tracking-tight">
              Recruitment & onboarding.
            </h3>
            <p className="mt-2 text-sm text-foreground/60">
              Applicant pipeline and new-starter checklists from a UK template.
            </p>
            <EvalRows />
          </div>
        </BentoCard>

        <BentoCard className="md:col-span-2">
          <div className="flex h-full flex-col">
            <Icon3D name="stack" className="mb-5" />
            <h3 className="text-xl font-semibold tracking-tight">
              Immigration & RTW.
            </h3>
            <p className="mt-2 text-sm text-foreground/60">
              Visa expiry tracking, sponsor licence and Certificate of Sponsorship.
            </p>
          </div>
        </BentoCard>

        <BentoCard className="md:col-span-2">
          <div className="flex h-full flex-col">
            <Icon3D name="wave" className="mb-5" />
            <h3 className="text-xl font-semibold tracking-tight">
              Reporting & analytics.
            </h3>
            <p className="mt-2 text-sm text-foreground/60">
              Headcount, diversity, payroll cost and recruitment funnels.
            </p>
          </div>
        </BentoCard>

        <BentoCard className="md:col-span-2">
          <div className="flex h-full flex-col">
            <Icon3D name="spark" className="mb-5" />
            <h3 className="text-xl font-semibold tracking-tight">
              Accounting & CT600.
            </h3>
            <p className="mt-2 text-sm text-foreground/60">
              Optional add-on: invoicing, VAT and corporation-tax preparation.
            </p>
          </div>
        </BentoCard>
      </div>
    </section>
  );
}

function FlowDiagram() {
  const nodes = [
    { x: 4, y: 50, label: "Applicant" },
    { x: 28, y: 22, label: "Onboard" },
    { x: 28, y: 78, label: "RTW check" },
    { x: 56, y: 50, label: "Active" },
    { x: 84, y: 50, label: "Leaver" },
  ];
  const links: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [3, 4],
  ];
  return (
    <div className="relative h-44 w-full overflow-hidden dark-island rounded-2xl border border-white/10 bg-zinc-950">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="flowstroke" x1="0" x2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {links.map(([a, b], i) => {
          const A = nodes[a];
          const B = nodes[b];
          return (
            <line
              key={i}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              stroke="url(#flowstroke)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
              opacity="0.9"
            />
          );
        })}
      </svg>
      {nodes.map((n) => (
        <div
          key={n.label}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full glass-strong px-3 py-1.5 text-[10px] font-medium text-foreground/85"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          {n.label}
        </div>
      ))}
    </div>
  );
}

function LatencyChart() {
  const data = [62, 48, 70, 40, 55, 32, 44, 28, 50, 30, 42, 22, 36, 24, 30];
  const path = `M 0 ${data[0]} ${data
    .map((v, i) => `L ${(i * 150) / (data.length - 1)} ${v}`)
    .join(" ")}`;
  return (
    <div className="h-24 w-full">
      <svg
        viewBox="0 0 150 60"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="latfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d={`${path} L 150 60 L 0 60 Z`} fill="url(#latfill)" />
      </svg>
    </div>
  );
}

function RegionMap() {
  const dots = [
    [22, 38],
    [30, 30],
    [44, 28],
    [50, 36],
    [58, 32],
    [70, 38],
    [82, 50],
    [76, 60],
    [60, 64],
    [40, 58],
    [28, 56],
    [50, 52],
  ];
  return (
    <div className="relative mt-5 h-40 w-full overflow-hidden dark-island rounded-2xl border border-white/10 bg-zinc-950">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <svg viewBox="0 0 100 80" className="absolute inset-0 h-full w-full">
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.9" fill="#a78bfa" />
        ))}
      </svg>
    </div>
  );
}

function EvalRows() {
  const rows = [
    { name: "RTW verified", pass: 98 },
    { name: "Contracts signed", pass: 94 },
    { name: "Pension enrolled", pass: 91 },
  ];
  return (
    <div className="mt-5 space-y-2">
      {rows.map((r) => (
        <div
          key={r.name}
          className="flex items-center justify-between rounded-lg border border-foreground/10 bg-foreground/[0.03] px-3 py-2 text-[12px]"
        >
          <span className="text-foreground/80">{r.name}</span>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                style={{ width: `${r.pass}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-foreground/70">
              {r.pass}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
