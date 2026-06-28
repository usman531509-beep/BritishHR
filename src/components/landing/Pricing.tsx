import {
  PricingCard,
  type PricingCardProps,
} from "@/components/landing/ui/animated-glassy-pricing";
import { Reveal } from "./Reveal";
import { listPublicPlans, planFeatures } from "@/lib/services/plans";

export async function Pricing() {
  const plans = await listPublicPlans();
  const cards: PricingCardProps[] = plans.map((p) => ({
    planName: p.name,
    description: p.description ?? "",
    price: String(Math.round(p.monthlyPence / 100)),
    features: planFeatures(p.features),
    buttonText: p.ctaText,
    isPopular: p.isPopular,
    buttonVariant: p.isPopular ? "primary" : "secondary",
  }));

  return (
    <section
      id="pricing"
      className="relative mx-auto max-w-7xl px-6 py-28 md:py-36"
    >
      <Reveal className="mx-auto max-w-3xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-foreground/70">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Pricing
        </div>
        <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Find the{" "}
          <span className="text-cyan-400">perfect plan</span> for your team.
        </h2>
        <p className="mt-4 text-pretty text-foreground/60">
          Per company, per month. 14-day free trial on every plan switch anytime.
        </p>
      </Reveal>

      {cards.length === 0 ? (
        <p className="mt-14 text-center text-foreground/50">Pricing coming soon.</p>
      ) : (
        <div className="mt-14 flex flex-col items-center justify-center gap-8 md:flex-row md:items-stretch md:gap-6">
          {cards.map((plan) => (
            <PricingCard key={plan.planName} {...plan} />
          ))}
        </div>
      )}
    </section>
  );
}
