import { useMemo, useState, useEffect } from "react";

interface DayStats {
  doors: number;
  conversations: number;
  leads: number;
  appointments: number;
  wins: number;
}

interface TrendViewProps {
  data: Record<string, DayStats>;
}

function getDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function shortLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function weekdayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", { weekday: "short" });
}

type Period = "7d" | "30d";

export default function TrendView({ data }: TrendViewProps) {
  const [period, setPeriod] = useState<Period>("7d");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { days, values, max, avg, total, trend } = useMemo(() => {
    const n = period === "7d" ? 7 : 30;
    const days = getDays(n);
    const values = days.map((d) => data[d]?.doors ?? 0);
    const max = Math.max(...values, 1);
    const total = values.reduce((s, v) => s + v, 0);
    const avg = Math.round(total / n);

    // Trend: compare first half vs second half
    const half = Math.floor(n / 2);
    const firstHalf = values.slice(0, half).reduce((s, v) => s + v, 0) / half;
    const secondHalf = values.slice(half).reduce((s, v) => s + v, 0) / (n - half);
    const trendPct = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : secondHalf > 0 ? 100 : 0;

    return { days, values, max, avg, total, trend: trendPct };
  }, [data, period]);

  if (!mounted) return null;

  return (
    <section className="w-full px-4 sm:px-10 bg-background">
      <div className="mx-auto max-w-5xl">
        <div className="border-2 border-foreground bg-card px-4 py-4 sm:px-5 sm:py-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase">Trend</h2>
            <div className="flex gap-1">
              {(["7d", "30d"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    period === p
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "7d" ? "7 Days" : "30 Days"}
                </button>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-muted px-3 py-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Total</div>
              <div className="text-base font-bold font-mono tabular-nums">{total}</div>
            </div>
            <div className="bg-muted px-3 py-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Daily Avg</div>
              <div className="text-base font-bold font-mono tabular-nums">{avg}</div>
            </div>
            <div className="bg-muted px-3 py-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Trend</div>
              <div className={`text-base font-bold font-mono tabular-nums ${trend > 0 ? "text-primary" : trend < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {Math.abs(trend)}%
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-px" style={{ height: 120 }}>
            {values.map((v, i) => {
              const h = max > 0 ? (v / max) * 100 : 0;
              const isToday = i === values.length - 1;
              return (
                <div
                  key={days[i]}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="bg-foreground text-background text-[9px] font-mono px-1.5 py-0.5 whitespace-nowrap">
                      {v} doors
                    </div>
                  </div>
                  <div
                    className={`w-full transition-all duration-300 ${
                      isToday ? "bg-primary" : v > 0 ? "bg-foreground/70" : "bg-muted"
                    }`}
                    style={{ height: `${Math.max(h, 2)}%`, minHeight: 2 }}
                  />
                </div>
              );
            })}
          </div>

          {/* Labels */}
          {period === "7d" ? (
            <div className="flex gap-px mt-1">
              {days.map((d) => (
                <div key={d} className="flex-1 text-center text-[8px] sm:text-[9px] font-mono text-muted-foreground">
                  {weekdayLabel(d)}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-between mt-1">
              <span className="text-[8px] sm:text-[9px] font-mono text-muted-foreground">{shortLabel(days[0])}</span>
              <span className="text-[8px] sm:text-[9px] font-mono text-muted-foreground">{shortLabel(days[Math.floor(days.length / 2)])}</span>
              <span className="text-[8px] sm:text-[9px] font-mono text-muted-foreground">{shortLabel(days[days.length - 1])}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
