const stats = [
  { value: "10+", label: "Integrated modules" },
  { value: "5", label: "Role-based portals" },
  { value: "2024/25", label: "UK PAYE/NI engine" },
  { value: "GDPR", label: "Compliance built in" },
];

export function Stats() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-12">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl glass md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-foreground/[0.02] px-6 py-7"
          >
            <div className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {s.value}
            </div>
            <div className="mt-1.5 text-xs uppercase tracking-widest text-foreground/45">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
