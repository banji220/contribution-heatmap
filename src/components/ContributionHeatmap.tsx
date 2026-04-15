import { useMemo, useState, useEffect, useRef, useCallback } from "react";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CELL = 10;
const GAP = 2;
const DAY_LABEL_WIDTH = 28;

interface DayStats {
  doors: number;
  conversations: number;
  leads: number;
  appointments: number;
  wins: number;
}

type DayEntry = { date: string; dow: number; count: number; stats: DayStats };

/** Accepts a map of "YYYY-MM-DD" → day stats. Builds the full calendar grid. */
function buildCalendar(data: Record<string, DayStats>): DayEntry[] {
  const today = new Date();
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 1);
  const startDay = new Date(oneYearAgo);
  startDay.setDate(oneYearAgo.getDate() - oneYearAgo.getDay());

  const days: DayEntry[] = [];
  const seen = new Set<string>();
  const d = new Date(startDay);
  const empty: DayStats = { doors: 0, conversations: 0, leads: 0, appointments: 0, wins: 0 };

  while (d <= today) {
    const key = d.toISOString().slice(0, 10);
    if (!seen.has(key)) {
      seen.add(key);
      const stats = data[key] ?? empty;
      days.push({ date: key, dow: d.getDay(), count: stats.doors, stats });
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/** Generate sample data for demo purposes */
function generateSampleData(): Record<string, DayStats> {
  const data: Record<string, DayStats> = {};
  const today = new Date();
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const d = new Date(oneYearAgo);

  while (d <= today) {
    const key = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const rand = Math.random();

    let doors = 0;
    if (isWeekday) {
      if (rand > 0.15) doors = Math.floor(Math.random() * 20) + 5;
      if (rand > 0.5) doors = Math.floor(Math.random() * 30) + 15;
      if (rand > 0.85) doors = Math.floor(Math.random() * 40) + 30;
    } else {
      if (rand > 0.5) doors = Math.floor(Math.random() * 10) + 1;
      if (rand > 0.8) doors = Math.floor(Math.random() * 15) + 5;
    }

    // Derive funnel metrics from doors
    const conversations = doors > 0 ? Math.floor(doors * (0.3 + Math.random() * 0.3)) : 0;
    const leads = conversations > 0 ? Math.floor(conversations * (0.2 + Math.random() * 0.4)) : 0;
    const appointments = leads > 0 ? Math.floor(leads * (0.3 + Math.random() * 0.4)) : 0;
    const wins = appointments > 0 ? Math.floor(appointments * (0.2 + Math.random() * 0.5)) : 0;

    data[key] = { doors, conversations, leads, appointments, wins };
    d.setDate(d.getDate() + 1);
  }
  return data;
}

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 8) return 1;    // low — dark orange
  if (count <= 20) return 2;   // medium — orange
  if (count <= 35) return 3;   // strong — bright orange
  if (count <= 50) return 4;   // very strong — orange-yellow
  return 5;                    // elite — glowing yellow
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function ContributionHeatmap() {
  const [sampleData, setSampleData] = useState<Record<string, DayStats>>({});
  useEffect(() => { setSampleData(generateSampleData()); }, []);
  const days = useMemo(() => buildCalendar(sampleData), [sampleData]);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ day: DayEntry; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent, day: DayEntry) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cellRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (rect) {
      setTooltip({
        day,
        x: cellRect.left - rect.left + cellRect.width / 2,
        y: cellRect.top - rect.top - 8,
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  // Streak calculation
  const { currentStreak, longestStreak, streakSet } = useMemo(() => {
    // Build set of active dates and find streaks
    const activeDates = new Set<string>();
    for (const day of days) {
      if (day.count > 0) activeDates.add(day.date);
    }

    let current = 0;
    let longest = 0;
    let streak = 0;
    const inStreak = new Set<string>();

    // Walk backwards from today to find current streak
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) {
        current++;
      } else {
        break;
      }
    }

    // Find longest streak and mark streak cells (3+ days)
    let runStart = -1;
    for (let i = 0; i < days.length; i++) {
      if (days[i].count > 0) {
        if (runStart === -1) runStart = i;
        streak++;
      } else {
        if (streak >= 3) {
          for (let j = runStart; j < i; j++) inStreak.add(days[j].date);
        }
        longest = Math.max(longest, streak);
        streak = 0;
        runStart = -1;
      }
    }
    // Handle streak at end
    if (streak >= 3) {
      for (let j = runStart; j < days.length; j++) inStreak.add(days[j].date);
    }
    longest = Math.max(longest, streak);

    return { currentStreak: current, longestStreak: longest, streakSet: inStreak };
  }, [days]);

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
    <section className="w-full px-6 py-10 sm:px-10 bg-background">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-baseline gap-3">
          <span className="text-4xl font-bold tabular-nums tracking-tight">
            {totalContributions.toLocaleString()}
          </span>
          <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            doors knocked this year
          </span>
        </div>

        <div ref={containerRef} className="overflow-x-auto border-2 border-foreground bg-card px-4 py-3 relative">
          {/* Tooltip */}
          {tooltip && (
            <div
              className="heatmap-tooltip"
              style={{
                left: tooltip.x,
                top: tooltip.y,
              }}
            >
              <div className="font-mono text-[11px] font-bold mb-1.5 opacity-80">
                {formatDate(tooltip.day.date)}
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
                <span className="opacity-60">Doors</span>
                <span className="text-right font-bold tabular-nums">{tooltip.day.stats.doors}</span>
                <span className="opacity-60">Convos</span>
                <span className="text-right font-bold tabular-nums">{tooltip.day.stats.conversations}</span>
                <span className="opacity-60">Leads</span>
                <span className="text-right font-bold tabular-nums">{tooltip.day.stats.leads}</span>
                <span className="opacity-60">Appts</span>
                <span className="text-right font-bold tabular-nums">{tooltip.day.stats.appointments}</span>
                <span className="opacity-60">Wins</span>
                <span className="text-right font-bold tabular-nums">{tooltip.day.stats.wins}</span>
              </div>
            </div>
          )}

          {/* Month labels row */}
          <div className="relative" style={{ height: 15, marginLeft: DAY_LABEL_WIDTH, width: gridWidth }}>
            {monthLabels.map((m, i) => {
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
                      onMouseEnter={(e) => handleMouseEnter(e, day)}
                      onMouseLeave={handleMouseLeave}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
            <span className="mr-0.5">Less</span>
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <div key={level} className="heatmap-cell" data-level={level} style={{ width: CELL, height: CELL }} />
            ))}
            <span className="ml-0.5">More</span>
          </div>
        </div>
      </div>
    </section>
  );
}
