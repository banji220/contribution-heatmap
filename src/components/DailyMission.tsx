import { useMemo, useState, useEffect, memo, useRef } from "react";

interface DailyMissionProps {
  doorsToday: number;
  target: number;
  onTargetChange?: (target: number) => void;
}

function getSuggestion(doorsToday: number, target: number, hour: number): string {
  const remaining = target - doorsToday;
  const percent = (doorsToday / target) * 100;

  if (doorsToday >= target * 1.5) return "Beast mode. You've blown past the goal.";
  if (doorsToday >= target) return "Mission complete. Anything extra is bonus.";
  if (doorsToday === 0 && hour >= 14) return "Day's slipping — start now, finish strong.";
  if (doorsToday === 0) return "Clock's ticking. First knock sets the tone.";
  if (remaining <= 5) return `Just ${remaining} more. You're right there.`;
  if (remaining <= 10) return `Push ${remaining} more doors to hit your goal.`;
  if (percent >= 70) return "You're on track for a strong day.";
  if (percent >= 40) return "Solid pace. Keep the momentum going.";
  if (percent < 30 && hour >= 15) return "You're behind pace today. Time to lock in.";
  if (percent < 30 && hour >= 12) return "Still early enough to catch up. Get moving.";
  return "Good start. Stay consistent and stack the numbers.";
}

export default memo(function DailyMission({ doorsToday, target, onTargetChange }: DailyMissionProps) {
  const [hour, setHour] = useState(12); // safe default for SSR
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(target));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setHour(new Date().getHours()); }, []);
  useEffect(() => { setDraft(String(target)); }, [target]);
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const { percent, status, statusLabel, emoji, suggestion } = useMemo(() => {
    const pct = Math.min(Math.round((doorsToday / target) * 100), 100);
    let s: "not_started" | "in_progress" | "done";
    let label: string;
    let e: string;
    if (doorsToday === 0) {
      s = "not_started";
      label = "Not started";
      e = "🎯";
    } else if (doorsToday >= target) {
      s = "done";
      label = "Mission complete";
      e = "🏆";
    } else {
      s = "in_progress";
      label = "In progress";
      e = "🔥";
    }
    return { percent: pct, status: s, statusLabel: label, emoji: e, suggestion: getSuggestion(doorsToday, target, hour) };
  }, [doorsToday, target, hour]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n > 0 && n <= 9999 && n !== target) {
      onTargetChange?.(n);
    } else {
      setDraft(String(target));
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(target));
    setEditing(false);
  };

  return (
    <section className="w-full px-4 sm:px-10 bg-background">
      <div className="mx-auto max-w-5xl">
        <div className="border-2 border-foreground bg-card px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl">{emoji}</span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase">Daily Mission</h2>
            </div>
            <div className="flex items-center gap-2">
              {onTargetChange && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-2 py-0.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider border-2 border-foreground bg-transparent text-foreground hover:bg-muted transition-colors"
                  aria-label="Edit daily target"
                >
                  Edit
                </button>
              )}
              <span
                className={`px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider border-2 ${
                  status === "done"
                    ? "border-accent-foreground bg-accent text-accent-foreground"
                    : status === "in_progress"
                      ? "border-foreground bg-transparent text-foreground"
                      : "border-muted-foreground bg-transparent text-muted-foreground"
                }`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          {editing && (
            <div className="mb-3 flex items-center gap-2 border-2 border-foreground bg-muted/40 px-3 py-2">
              <label htmlFor="daily-target-input" className="text-xs font-mono font-bold uppercase tracking-wider">
                Daily target:
              </label>
              <input
                id="daily-target-input"
                ref={inputRef}
                type="number"
                min={1}
                max={9999}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") cancel();
                }}
                className="w-20 border-2 border-foreground bg-background px-2 py-1 text-sm font-mono font-bold text-foreground focus:outline-none"
              />
              <span className="text-xs font-mono text-muted-foreground">doors</span>
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={commit}
                  className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border-2 border-foreground bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={cancel}
                  className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border-2 border-foreground bg-transparent text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="relative h-6 w-full bg-muted overflow-hidden">
            <div
              className="h-full transition-[width] duration-300 ease-out"
              style={{
                width: `${percent}%`,
                background: status === "done"
                  ? "var(--heatmap-5)"
                  : percent > 60
                    ? "var(--heatmap-4)"
                    : percent > 30
                      ? "var(--heatmap-3)"
                      : "var(--heatmap-2)",
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-foreground">
              {doorsToday} / {target} doors
            </span>
          </div>

          {/* Smart suggestion */}
          <p className="mt-3 text-sm font-mono text-muted-foreground">
            {suggestion}
          </p>
        </div>
      </div>
    </section>
  );
});
