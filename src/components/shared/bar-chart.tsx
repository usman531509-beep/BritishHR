import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export interface BarDatum {
  label: string;
  value: number;
}

// Dependency-free horizontal bar chart for dashboards.
export function BarChart({ title, data, format }: { title: string; data: BarDatum[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = format ?? ((n: number) => String(n));
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data.</p>
        ) : (
          <ul className="space-y-2.5">
            {data.map((d) => (
              <li key={d.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-text">{d.label}</span>
                  <span className="text-muted-foreground">{fmt(d.value)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round((d.value / max) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
