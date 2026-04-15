import { useMemo } from "react";

interface DayStats {
  doors: number;
  conversations: number;
  leads: number;
  appointments: number;
  wins: number;
}

interface WeeklyInsightsProps {
  data: Record<string, DayStats>;
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
    if (d <= today) {
      days.push(d.toISOString().slice(0, 10));
    }
  }
  return days;
}

function dayName(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", { weekday: "short" });
}

export default function WeeklyInsights({ data }: WeeklyInsightsProps) {
  const insights = useMemo(() => {
    const weekDays = getWeekDays();
    const empty: DayStats = { doors: 0, conversations: 0, leads: 0, appointments: 0, wins: 0 };

    const entries = weekDays.map((date) => ({
      date,
      stats: data[date] ?? empty,
    }));

    const activeDays = entries.filter((e) => e.stats.doors > 0);
    const total = entries.reduce((s, e) => s + e.stats.doors, 0);
    const avg = weekDays.length > 0 ? Math.round(total / weekDays.length) : 0;

    let best = entries[0];
    let worst = entries[0];
    for (const e of entries) {
      if (e.stats.doors > (best?.stats.doors ?? 0)) best = e;
      if (e.stats.doors < (worst?.stats.doors ?? Infinity)) worst = e;
    }

    const totalWins = entries.reduce((s, e) => s + e.stats.wins, 0);
    const totalConvos = entries.reduce((s, e) => s + e.stats.conversations, 0);
    const totalLeads = entries.reduce((s, e) => s + e.stats.leads, 0);

    const convToLeadPct = totalConvos > 0 ? Math.round((totalLeads / totalConvos) * 100) : 0;
    const leadToWinPct = totalLeads > 0 ? Math.round((totalWins / totalLeads) * 100) : 0;

    return { total, avg, best, worst, activeDays: activeDays.length, totalDays: weekDays.length, totalWins, totalConvos, totalLeads, convToLeadPct, leadToWinPct };
  }, [data]);

  if (insights.totalDays === 0) return null;

  const stats = [
    { label: "Total Doors", value: insights.total.toLocaleString(), icon: "🚪" },
    { label: "Daily Avg", value: String(insights.avg), icon: "📊" },
    { label: "Best Day", value: insights.best ? `${dayName(insights.best.date)} · ${insights.best.stats.doors}` : "—", icon: "⬆" },
    { label: "Weakest Day", value: insights.worst ? `${dayName(insights.worst.date)} · ${insights.worst.stats.doors}` : "—", icon: "⬇" },
  ];

  return (
    <section className="w-full px-4 sm:px-10 bg-background">
      <div className="mx-auto max-w-5xl">
        <div className="border-2 border-foreground bg-card px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase">This Week</h2>
            <span className="text-xs font-mono text-muted-foreground">
              {insights.activeDays}/{insights.totalDays} active days
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="bg-muted px-3 py-3">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                  {s.icon} {s.label}
                </div>
                <div className="text-base sm:text-lg font-bold font-mono tabular-nums truncate">
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Conversion metrics */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-muted/60 px-3 py-2.5">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                🗣 Convos → Leads
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold font-mono tabular-nums">{insights.convToLeadPct}%</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {insights.totalLeads}/{insights.totalConvos}
                </span>
              </div>
              <div className="w-full h-1 bg-muted-foreground/15 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${insights.convToLeadPct}%` }} />
              </div>
            </div>
            <div className="bg-muted/60 px-3 py-2.5">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                🎯 Leads → Wins
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold font-mono tabular-nums">{insights.leadToWinPct}%</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {insights.totalWins}/{insights.totalLeads}
                </span>
              </div>
              <div className="w-full h-1 bg-muted-foreground/15 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${insights.leadToWinPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
