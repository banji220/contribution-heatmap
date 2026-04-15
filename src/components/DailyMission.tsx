import { useMemo } from "react";

interface DailyMissionProps {
  doorsToday: number;
  target: number;
}

export default function DailyMission({ doorsToday, target }: DailyMissionProps) {
  const { percent, status, statusLabel, emoji } = useMemo(() => {
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
    return { percent: pct, status: s, statusLabel: label, emoji: e };
  }, [doorsToday, target]);

  return (
    <section className="w-full px-6 sm:px-10 bg-background">
      <div className="mx-auto max-w-5xl">
        <div className="border-2 border-foreground bg-card px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{emoji}</span>
              <h2 className="text-lg font-bold tracking-tight uppercase">Daily Mission</h2>
            </div>
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

          {/* Progress bar */}
          <div className="relative h-6 w-full bg-muted overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out"
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

          {/* Motivational line */}
          <p className="mt-3 text-sm font-mono text-muted-foreground">
            {status === "done"
              ? "You crushed it today. Rest up for tomorrow."
              : status === "in_progress"
                ? `${target - doorsToday} more to hit your target. Keep going.`
                : "Time to get after it. Every door counts."}
          </p>
        </div>
      </div>
    </section>
  );
}
