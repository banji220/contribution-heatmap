import { useMemo, useState, useCallback, useRef, useEffect, memo } from "react";

interface WeeklyGoalProps {
  data: Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }>;
  weeklyTarget?: number;
  onTargetChange?: (target: number) => void;
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

export default memo(function WeeklyGoal({ data, weeklyTarget = 150, onTargetChange }: WeeklyGoalProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(weeklyTarget));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const startEdit = useCallback(() => {
    setDraft(String(weeklyTarget));
    setEditing(true);
  }, [weeklyTarget]);

  const commitEdit = useCallback(() => {
    const val = Math.max(1, Math.min(9999, parseInt(draft, 10) || weeklyTarget));
    onTargetChange?.(val);
    setEditing(false);
  }, [draft, weeklyTarget, onTargetChange]);

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
    <section className="w-full px-4 sm:px-10 bg-background">
      <div className="mx-auto max-w-5xl">
        <div className={`border-2 border-foreground px-4 py-4 sm:px-5 sm:py-5 ${done ? "bg-foreground text-background" : "bg-card"}`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase">Weekly Goal</h2>
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${done ? "opacity-80" : "text-muted-foreground"}`}>
              {done ? "✓ Complete" : `${daysLeft}d left`}
            </span>
          </div>

          {/* Big number row */}
          <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
            <span className="text-3xl sm:text-5xl font-bold font-mono tabular-nums">{total}</span>
            <span className={`text-sm font-mono ${done ? "opacity-60" : "text-muted-foreground"} flex items-baseline gap-1`}>
              /
              {editing ? (
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={9999}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
                  className="w-16 bg-transparent border-b-2 border-current text-sm font-mono font-bold tabular-nums outline-none text-inherit px-0 py-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              ) : (
                <button
                  onClick={startEdit}
                  className={`font-bold border-b border-dashed border-current cursor-pointer hover:opacity-70 transition-opacity ${done ? "text-background" : "text-foreground"}`}
                >
                  {weeklyTarget}
                </button>
              )}
              {" "}doors
            </span>
            <span className={`ml-auto text-2xl font-bold font-mono tabular-nums ${done ? "opacity-80" : ""}`}>{percent}%</span>
          </div>

          {/* Progress bar */}
          <div className={`relative h-3 w-full overflow-hidden ${done ? "bg-background/20" : "bg-muted"}`}>
            <div
              className="h-full transition-[width] duration-300 ease-out"
              style={{
                width: `${percent}%`,
                backgroundColor: done ? "var(--background)" : percent > 60 ? "var(--heatmap-4)" : percent > 30 ? "var(--heatmap-3)" : "var(--heatmap-2)",
              }}
            />
          </div>

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
});
