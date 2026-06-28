import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

// Optional modules gated per tenant via Tenant.featureFlags (JSON map of flag→bool).
export type FeatureFlag = "accounting";

export function enabledFeatures(featureFlags: unknown): FeatureFlag[] {
  if (!featureFlags || typeof featureFlags !== "object") return [];
  const map = featureFlags as Record<string, unknown>;
  return (Object.keys(map) as FeatureFlag[]).filter((k) => map[k] === true);
}

export async function isFeatureEnabled(tenantId: string, flag: FeatureFlag): Promise<boolean> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { featureFlags: true } });
  return enabledFeatures(t?.featureFlags).includes(flag);
}

/** Page guard: redirect to /admin if the optional module isn't enabled for the tenant. */
export async function requireFeature(tenantId: string, flag: FeatureFlag) {
  if (!(await isFeatureEnabled(tenantId, flag))) redirect("/admin");
}
