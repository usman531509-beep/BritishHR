// Pricing is read from the database (managed by the Platform Owner), so render per request.
export const dynamic = "force-dynamic";

import { AnimatedGradient } from "@/components/landing/AnimatedGradient";
import { Bento } from "@/components/landing/Bento";
import { CTA } from "@/components/landing/CTA";
import { FeatureTabs } from "@/components/landing/FeatureTabs";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Nav } from "@/components/landing/Nav";
import { Pricing } from "@/components/landing/Pricing";
import { Stats } from "@/components/landing/Stats";
import { Workflow } from "@/components/landing/Workflow";
import { getSessionContext } from "@/lib/auth/session";
import { homeForRoles } from "@/lib/nav";

export default async function HomePage() {
  const ctx = await getSessionContext();
  const session = ctx
    ? { name: ctx.name, email: ctx.email, dashboardHref: homeForRoles(ctx.roles) }
    : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedGradient />
      <Nav session={session} />
      <main>
        <Hero />
        <Stats />
        <Bento />
        <Workflow />
        <FeatureTabs />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
