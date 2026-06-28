import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export interface CalendarEntry {
  start: Date;
  end: Date;
  label: string;
  colour: string;
}

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Static month grid (UTC). Highlights days that fall within any leave entry.
export function LeaveCalendar({ year, month, entries }: { year: number; month: number; entries: CalendarEntry[] }) {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  // Convert Sun(0)–Sat(6) to Mon-first offset.
  const startOffset = (first.getUTCDay() + 6) % 7;

  const monthName = first.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function entriesOn(day: number): CalendarEntry[] {
    const date = Date.UTC(year, month, day);
    return entries.filter((e) => {
      const s = Date.UTC(e.start.getUTCFullYear(), e.start.getUTCMonth(), e.start.getUTCDate());
      const en = Date.UTC(e.end.getUTCFullYear(), e.end.getUTCMonth(), e.end.getUTCDate());
      return date >= s && date <= en;
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>{monthName}</CardTitle></CardHeader>
      <CardBody>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
          {WD.map((w) => <div key={w} className="py-1">{w}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="min-h-16 rounded-lg" />;
            const dayEntries = entriesOn(day);
            return (
              <div key={i} className="min-h-16 rounded-lg border border-border p-1 text-left">
                <span className="text-xs font-medium text-muted-foreground">{day}</span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEntries.slice(0, 3).map((e, j) => (
                    <div
                      key={j}
                      className="truncate rounded px-1 py-0.5 text-[0.6rem] font-medium text-white"
                      style={{ background: e.colour }}
                      title={e.label}
                    >
                      {e.label}
                    </div>
                  ))}
                  {dayEntries.length > 3 ? (
                    <div className="text-[0.6rem] text-muted-foreground">+{dayEntries.length - 3}</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
