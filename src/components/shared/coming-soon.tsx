import { Construction } from "lucide-react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";

export function ComingSoon({ title, phase }: { title: string; phase?: string }) {
  return (
    <>
      <PageHeader title={title} />
      <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Construction className="h-7 w-7" />
        </div>
        <h2 className="font-display text-lg font-bold">Module on the roadmap</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          The data model and navigation for <strong>{title}</strong> are in place. Functionality
          lands in {phase ?? "a later phase"} of the build. See{" "}
          <code className="rounded bg-bg px-1.5 py-0.5 text-xs">docs/ANALYSIS_AND_ARCHITECTURE.md</code>{" "}
          for the roadmap.
        </p>
      </Card>
    </>
  );
}
