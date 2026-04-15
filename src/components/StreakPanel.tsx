import { memo } from "react";

interface StreakPanelProps {
  currentStreak: number;
  longestStreak: number;
}

function getStreakStatus(current: number): { label: string; emoji: string; tone: "hot" | "warm" | "cold" } {
  if (current >= 10) return { label: "On fire", emoji: "🔥", tone: "hot" };
  if (current >= 5) return { label: "Hot streak", emoji: "🔥", tone: "hot" };
  if (current >= 3) return { label: "Warming up", emoji: "⚡", tone: "warm" };
  if (current >= 1) return { label: "Active", emoji: "✓", tone: "warm" };
  return { label: "Cold", emoji: "❄️", tone: "cold" };
}

export default memo(function StreakPanel({ currentStreak, longestStreak }: StreakPanelProps) {
  const status = getStreakStatus(currentStreak);
  const pct = longestStreak > 0 ? Math.min(Math.round((currentStreak / longestStreak) * 100), 100) : 0;

  return (
    <section className="w-full px-4 sm:px-10 bg-background">
      <div className="mx-auto max-w-5xl">
        <div className="border-2 border-foreground bg-card px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase">Streak</h2>
            <span
              className={`px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider border-2 ${
                status.tone === "hot"
                  ? "border-foreground bg-foreground text-background"
                  : status.tone === "warm"
                    ? "border-foreground bg-transparent text-foreground"
                    : "border-muted-foreground bg-transparent text-muted-foreground"
              }`}
            >
              {status.emoji} {status.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Current streak */}
            <div className={`px-4 py-4 ${status.tone === "hot" ? "bg-foreground text-background" : "bg-muted"}`}>
              <div className="text-[10px] font-mono uppercase tracking-wider opacity-60 mb-1">Current</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-bold font-mono tabular-nums">{currentStreak}</span>
                <span className="text-sm font-mono opacity-60">days</span>
              </div>
            </div>

            {/* Best streak */}
            <div className="bg-muted px-4 py-4">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Best</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-bold font-mono tabular-nums">{longestStreak}</span>
                <span className="text-sm font-mono text-muted-foreground">days</span>
              </div>
            </div>
          </div>

          {/* Progress toward best */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
              <span>Progress to best</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 w-full bg-muted overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: status.tone === "hot" ? "var(--heatmap-5)" : status.tone === "warm" ? "var(--heatmap-3)" : "var(--heatmap-1)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
