import { useMemo } from "react";

const DAYS_IN_WEEK = 7;
const WEEKS_TO_SHOW = 52;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function generateContributions(): { date: Date; count: number }[] {
  const today = new Date();
  const contributions: { date: Date; count: number }[] = [];

  for (let i = WEEKS_TO_SHOW * 7 - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    // Weighted random: mostly low, occasional bursts
    const rand = Math.random();
    let count = 0;
    if (rand > 0.3) count = Math.floor(Math.random() * 4);
    if (rand > 0.7) count = Math.floor(Math.random() * 8) + 3;
    if (rand > 0.92) count = Math.floor(Math.random() * 12) + 8;
    contributions.push({ date, count });
  }
  return contributions;
}

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

export default function ContributionHeatmap() {
  const contributions = useMemo(() => generateContributions(), []);

  const weeks = useMemo(() => {
    const result: { date: Date; count: number }[][] = [];
    for (let w = 0; w < WEEKS_TO_SHOW; w++) {
      result.push(contributions.slice(w * DAYS_IN_WEEK, (w + 1) * DAYS_IN_WEEK));
    }
    return result;
  }, [contributions]);

  const totalContributions = useMemo(
    () => contributions.reduce((sum, c) => sum + c.count, 0),
    [contributions]
  );

  // Month labels with positions
  const monthPositions = useMemo(() => {
    const positions: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const month = week[0]?.date.getMonth();
      if (month !== undefined && month !== lastMonth) {
        positions.push({ label: MONTH_LABELS[month], col: i });
        lastMonth = month;
      }
    });
    return positions;
  }, [weeks]);

  return (
    <section className="w-full px-4 py-10 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm text-muted-foreground">
          {totalContributions.toLocaleString()} contributions in the last year
        </p>

        <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
          {/* Month labels */}
          <div className="flex" style={{ paddingLeft: 32 }}>
            {monthPositions.map((m, i) => (
              <span
                key={i}
                className="text-xs text-muted-foreground"
                style={{
                  position: "relative",
                  left: m.col * 15 - (i > 0 ? monthPositions[i - 1].col * 15 + (MONTH_LABELS[monthPositions[i - 1].label === m.label ? 0 : 0].length * 6) : 0),
                  minWidth: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {/* Simplified: use absolute positioning */}
              </span>
            ))}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 pr-2 pt-5">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="flex h-[13px] items-center">
                  <span className="text-[10px] leading-none text-muted-foreground w-6 text-right">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div>
              {/* Month labels row */}
              <div className="flex gap-0.5 mb-1 h-4">
                {weeks.map((week, wi) => {
                  const month = week[0]?.date.getMonth();
                  const prevMonth = wi > 0 ? weeks[wi - 1][0]?.date.getMonth() : -1;
                  const showLabel = month !== prevMonth;
                  return (
                    <div key={wi} className="w-[13px] flex-shrink-0">
                      {showLabel && (
                        <span className="text-[10px] text-muted-foreground leading-none">
                          {MONTH_LABELS[month!]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-0.5">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((day, di) => (
                      <div
                        key={di}
                        className="heatmap-cell"
                        data-level={getLevel(day.count)}
                        title={`${day.count} contributions on ${day.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className="heatmap-cell" data-level={level} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </section>
  );
}
