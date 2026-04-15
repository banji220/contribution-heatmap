import { useMemo } from "react";

interface WeeklyGoalProps {
  data: Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }>;
  weeklyTarget?: number;
}

function getWeekDays(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dow);
  const days: string[] = [];
  for (let i = 0; i <= Math.min(dow, 6); i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    if (d <= today) days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function WeeklyGoal({ data, weeklyTarget = 150 }: WeeklyGoalProps) {
  const { total, percent, daysLeft, paceNeeded } = useMemo(() => {
    const weekDays = getWeekDays();
    const t = weekDays.reduce((s, d) => s + (data[d]?.doors ?? 0), 0);
    const pct = Math.min(Math.round((t / weeklyTarget) * 100), 100);
    const remaining = 7 - weekDays.length;
    const needed = remaining > 0 ? Math.max(Math.ceil((weeklyTarget - t) / remaining), 0) : 0;
    return { total: t, percent: pct, daysLeft: remaining, paceNeeded: needed };
  }, [data, weeklyTarget]);

  const done = percent >= 100;

  return (
    <section className="w-full px-6 sm:px-10 bg-background">
      <div className="mx-auto max-w-5xl">
        <div className={`border-2 border-foreground px-5 py-5 ${done ? "bg-foreground text-background" : "bg-card"}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold tracking-tight uppercase">Weekly Goal</h2>
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${done ? "opacity-80" : "text-muted-foreground"}`}>
              {done ? "✓ Complete" : `${daysLeft}d left`}
            </span>
          </div>

          {/* Big number row */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl sm:text-5xl font-bold font-mono tabular-nums">{total}</span>
            <span className={`text-sm font-mono ${done ? "opacity-60" : "text-muted-foreground"}`}>/ {weeklyTarget} doors</span>
            <span className={`ml-auto text-2xl font-bold font-mono tabular-nums ${done ? "opacity-80" : ""}`}>{percent}%</span>
          </div>

          {/* Progress bar */}
          <div className={`relative h-3 w-full overflow-hidden ${done ? "bg-background/20" : "bg-muted"}`}>
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${percent}%`,
                backgroundColor: done ? "var(--background)" : percent > 60 ? "var(--heatmap-4)" : percent > 30 ? "var(--heatmap-3)" : "var(--heatmap-2)",
              }}
            />
          </div>

          {/* Pace note */}
          {!done && daysLeft > 0 && (
            <p className={`mt-2 text-xs font-mono ${done ? "opacity-60" : "text-muted-foreground"}`}>
              Need {paceNeeded}/day to hit target
            </p>
          )}
          {done && (
            <p className="mt-2 text-xs font-mono opacity-60">
              Goal reached. Keep stacking.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
