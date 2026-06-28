export function AnimatedGradient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg"
      style={{ contain: "strict" }}
    >
      {/* Subtle themed wash along the very top — no centred oval glow.
          Stronger in dark mode, a light touch in light mode. */}
      <div
        className="absolute inset-x-0 top-0 h-[55vh] opacity-30 dark:opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(70vmax 20vmax at 50% -14%, color-mix(in srgb, var(--accent-violet) 18%, transparent), transparent 72%)",
        }}
      />
      {/* Faint grid */}
      <div className="absolute inset-0 grid-bg opacity-25 dark:opacity-50" />
      {/* Vignette only in dark mode so light mode stays light/grey */}
      <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(7,7,11,0.9)_100%)]" />
    </div>
  );
}
