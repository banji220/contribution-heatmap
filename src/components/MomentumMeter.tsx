import { useMemo } from "react";

interface MomentumMeterProps {
  data: Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }>;
}

function getRecentDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    days.unshift(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - 1);
  }
  return days;
}

function getMomentumLabel(score: number): { label: string; emoji: string; tone: "peak" | "high" | "mid" | "low" | "dead" } {
  if (score >= 85) return { label: "Peak", emoji: "⚡", tone: "peak" };
  if (score >= 65) return { label: "Strong", emoji: "🔥", tone: "high" };
  if (score >= 40) return { label: "Building", emoji: "📈", tone: "mid" };
  if (score >= 15) return { label: "Slow", emoji: "🐢", tone: "low" };
  return { label: "Stalled", emoji: "💤", tone: "dead" };
}

export default function MomentumMeter({ data }: MomentumMeterProps) {
  const { score, status, recentDoors, trend } = useMemo(() => {
    const last7 = getRecentDays(7);
    const prev7 = getRecentDays(14).slice(0, 7);

    const recentDoors = last7.map((d) => data[d]?.doors ?? 0);
    const prevDoors = prev7.map((d) => data[d]?.doors ?? 0);

    const recentTotal = recentDoors.reduce((a, b) => a + b, 0);
    const prevTotal = prevDoors.reduce((a, b) => a + b, 0);
    const activeDays = recentDoors.filter((d) => d > 0).length;

    // Consistency: how many of the last 7 days were active (0-100)
    const consistency = (activeDays / 7) * 100;

    // Volume: compare to a reasonable daily target of ~25 doors
    const avgDaily = recentTotal / 7;
    const volume = Math.min((avgDaily / 25) * 100, 100);

    // Trend: are we improving vs previous week
    const trendDir = prevTotal > 0 ? ((recentTotal - prevTotal) / prevTotal) * 100 : recentTotal > 0 ? 100 : 0;

    // Weighted score
    const raw = consistency * 0.45 + volume * 0.4 + Math.min(Math.max(trendDir + 50, 0), 100) * 0.15;
    const s = Math.round(Math.min(Math.max(raw, 0), 100));

    return {
      score: s,
      status: getMomentumLabel(s),
      recentDoors,
      trend: trendDir,
    };
  }, [data]);

  const barColor =
    status.tone === "peak" ? "var(--heatmap-5)" :
    status.tone === "high" ? "var(--heatmap-4)" :
    status.tone === "mid" ? "var(--heatmap-3)" :
    status.tone === "low" ? "var(--heatmap-2)" :
    "var(--heatmap-1)";

  const maxBar = Math.max(...recentDoors, 1);

  return (
    <section className="w-full px-4 sm:px-10 bg-background">
      <div className="mx-auto max-w-5xl">
        <div className="border-2 border-foreground bg-card px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase">Momentum</h2>
            <span
              className={`px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider border-2 ${
                status.tone === "peak" || status.tone === "high"
                  ? "border-foreground bg-foreground text-background"
                  : "border-muted-foreground bg-transparent text-muted-foreground"
              }`}
            >
              {status.emoji} {status.label}
            </span>
          </div>

          {/* Score gauge */}
          <div className="relative h-8 w-full bg-muted overflow-hidden mb-1">
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{ width: `${score}%`, backgroundColor: barColor }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-foreground">
              {score}/100
            </span>
          </div>

          <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-4">
            <span>Stalled</span>
            <span>Peak</span>
          </div>

          {/* 7-day mini bars */}
          <div className="flex items-end gap-1 h-12">
            {recentDoors.map((count, i) => {
              const h = maxBar > 0 ? (count / maxBar) * 100 : 0;
              const dayNames = ["", "", "", "", "", "", "Today"];
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const label = i === 6 ? "Today" : d.toLocaleDateString("en-US", { weekday: "narrow" });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative" style={{ height: 32 }}>
                    <div
                      className="absolute bottom-0 w-full transition-all duration-500"
                      style={{
                        height: `${Math.max(h, 4)}%`,
                        backgroundColor: count > 0 ? barColor : "var(--heatmap-0)",
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Trend line */}
          <div className="mt-3 text-xs font-mono text-muted-foreground">
            {trend > 10
              ? `↑ ${Math.round(trend)}% vs last week`
              : trend < -10
                ? `↓ ${Math.round(Math.abs(trend))}% vs last week`
                : "→ Holding steady vs last week"}
          </div>
        </div>
      </div>
    </section>
  );
}
