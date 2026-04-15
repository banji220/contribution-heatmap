import { useMemo } from "react";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CELL = 10;
const GAP = 2;
const DAY_LABEL_WIDTH = 28;

type DayEntry = { date: string; dow: number; count: number };

function generateContributions(): DayEntry[] {
  const today = new Date();
  // Go back exactly one year
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 1);
  // Align start to the Sunday of that week
  const startDay = new Date(oneYearAgo);
  startDay.setDate(oneYearAgo.getDate() - oneYearAgo.getDay());

  const days: DayEntry[] = [];
  const seen = new Set<string>();
  const d = new Date(startDay);

  while (d <= today) {
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!seen.has(key)) {
      seen.add(key);
      const rand = Math.random();
      let count = 0;
      if (rand > 0.3) count = Math.floor(Math.random() * 4);
      if (rand > 0.7) count = Math.floor(Math.random() * 8) + 3;
      if (rand > 0.92) count = Math.floor(Math.random() * 12) + 8;
      days.push({ date: key, dow: d.getDay(), count });
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

export default function ContributionHeatmap() {
  const days = useMemo(() => generateContributions(), []);

  // Group into weeks (columns). Each week is Sun–Sat (7 rows).
  const weeks = useMemo(() => {
    const result: DayEntry[][] = [];
    let week: DayEntry[] = [];
    for (const day of days) {
      if (day.dow === 0 && week.length > 0) {
        result.push(week);
        week = [];
      }
      week.push(day);
    }
    if (week.length > 0) result.push(week);
    return result;
  }, [days]);

  const totalContributions = useMemo(
    () => days.reduce((sum, c) => sum + c.count, 0),
    [days]
  );

  // Month labels: show at the first week where that month's Sunday falls
  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const month = parseInt(week[0].date.slice(5, 7), 10) - 1;
      if (month !== lastMonth) {
        labels.push({ label: MONTH_LABELS[month], col: i });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  const colWidth = CELL + GAP;
  const gridWidth = weeks.length * colWidth - GAP;

  return (
    <section className="w-full px-4 py-10 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-sm text-muted-foreground">
          {totalContributions.toLocaleString()} contributions in the last year
        </p>

        <div className="overflow-x-auto rounded-md border border-border bg-card px-4 py-3">
          {/* Month labels row */}
          <div className="relative" style={{ height: 15, marginLeft: DAY_LABEL_WIDTH, width: gridWidth }}>
            {monthLabels.map((m, i) => {
              // Skip if too close to previous label
              const tooClose = i > 0 && (m.col - monthLabels[i - 1].col) < 4;
              if (tooClose) return null;
              return (
                <span
                  key={i}
                  className="absolute text-[11px] leading-none text-muted-foreground"
                  style={{ left: m.col * colWidth }}
                >
                  {m.label}
                </span>
              );
            })}
          </div>

          <div className="flex">
            {/* Day-of-week labels */}
            <div className="flex flex-col shrink-0" style={{ width: DAY_LABEL_WIDTH, gap: GAP }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => (
                <div key={i} style={{ height: CELL }} className="flex items-center">
                  <span className="text-[11px] leading-none text-muted-foreground">
                    {i === 1 || i === 3 || i === 5 ? label : ""}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {wi === 0 &&
                    Array.from({ length: week[0].dow }).map((_, pi) => (
                      <div key={`pad-${pi}`} style={{ width: CELL, height: CELL }} />
                    ))}
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className="heatmap-cell"
                      data-level={getLevel(day.count)}
                      style={{ width: CELL, height: CELL }}
                      title={`${day.count} contributions on ${day.date}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
            <span className="mr-0.5">Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className="heatmap-cell" data-level={level} style={{ width: CELL, height: CELL }} />
            ))}
            <span className="ml-0.5">More</span>
          </div>
        </div>
      </div>
    </section>
  );
}
