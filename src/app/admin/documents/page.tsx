import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function DocumentsPage() {
  const ctx = await requireTenant();
  const docs = await prisma.document.findMany({
    where: { tenantId: ctx.tenantId, deletedAt: null },
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Contracts, policies and certificates with expiry & retention tracking"
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {docs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  No documents uploaded yet. File upload & e-signature land in Phase 1.5 (storage abstraction is in place).
                </td>
              </tr>
            ) : (
              docs.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium">{d.title}</td>
                  <td className="px-4 py-3"><Badge tone="neutral">{d.category.replace(/_/g, " ")}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.employee ? `${d.employee.firstName} ${d.employee.lastName}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.expiresAt ? formatDate(d.expiresAt) : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </Card>
    </>
  );
}
