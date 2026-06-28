import { Icon3D } from "./Icon3D";
import { Reveal } from "./Reveal";

const steps = [
  { icon: "spark" as const, title: "Onboard", body: "Add employees, contracts and Right-to-Work checks, then run onboarding checklists from a UK template." },
  { icon: "shield" as const, title: "Operate", body: "Manage leave, attendance, rota and expenses day to day across role-based portals." },
  { icon: "globe" as const, title: "Stay compliant", body: "Automated alerts for visas, RTW, document expiry, DSAR deadlines and H&S reviews." },
  { icon: "wave" as const, title: "Pay & report", body: "Prepare PAYE, NI and pension payroll, generate payslips and surface analytics." },
];

export function Workflow() {
  return (
    <section
      id="workflow"
      className="relative mx-auto max-w-7xl px-6 py-28 md:py-36"
    >
      <Reveal direction="right">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-foreground/70">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          How it works
        </div>
        <h2 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          From hire to payday every step covered.
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="group relative h-full overflow-hidden rounded-3xl glass p-6 transition-[transform,background-color] duration-300 hover:-translate-y-1 hover:bg-foreground/[0.06]"
          >
            <div className="mb-5 flex items-center justify-between">
              <Icon3D name={s.icon} className="!h-12 !w-12" />
              <span className="font-mono text-[11px] tracking-widest text-foreground/30">
                0{i + 1}
              </span>
            </div>
            <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/60">
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
