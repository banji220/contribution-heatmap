import { useMemo, useState, useEffect, useRef, useCallback, memo } from "react";
import DayDetail from "./DayDetail";
import MobileHeatmap from "./MobileHeatmap";
import { useIsMobile } from "@/hooks/use-mobile";

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

type MetricKey = "doors" | "conversations" | "leads" | "wins";

const METRICS: { key: MetricKey; label: string; short: string }[] = [
  { key: "doors", label: "Doors", short: "doors knocked" },
  { key: "conversations", label: "Convos", short: "conversations" },
  { key: "leads", label: "Leads", short: "leads generated" },
  { key: "wins", label: "Wins", short: "wins closed" },
];

const METRIC_THRESHOLDS: Record<MetricKey, [number, number, number, number]> = {
  doors: [8, 20, 35, 50],
  conversations: [3, 8, 15, 25],
  leads: [1, 3, 6, 10],
  wins: [1, 2, 4, 6],
};

type DayEntry = { date: string; dow: number; count: number; stats: DayStats };

function buildCalendar(data: Record<string, DayStats>, metric: MetricKey): DayEntry[] {
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
      days.push({ date: key, dow: d.getDay(), count: stats[metric], stats });
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}


function getLevel(count: number, metric: MetricKey): number {
  if (count === 0) return 0;
  const t = METRIC_THRESHOLDS[metric];
  if (count >= t[3]) return 5;
  if (count >= t[2]) return 4;
  if (count >= t[1]) return 3;
  if (count >= t[0]) return 2;
  return 1;
}

function getRecency(dateStr: string): string {
  const today = new Date();
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
  if (diffDays <= 14) return "3";
  if (diffDays <= 45) return "2";
  if (diffDays <= 90) return "1";
  return "0";
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

interface ContributionHeatmapProps {
  data: Record<string, DayStats>;
}

export default function ContributionHeatmap({ data: externalData }: ContributionHeatmapProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const [sampleData, setSampleData] = useState<Record<string, DayStats>>(externalData);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("doors");
  const [range, setRange] = useState<"90d" | "year">("year");
  const [userOverride, setUserOverride] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setSampleData(externalData); }, [externalData]);

  // Auto-switch based on screen size, but respect manual override
  useEffect(() => {
    if (!userOverride) {
      const newRange = isMobile ? "90d" : "year";
      if (newRange !== range) {
        setTransitioning(true);
        setTimeout(() => {
          setRange(newRange);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setTransitioning(false));
          });
        }, 150);
      }
    }
  }, [isMobile, userOverride]);

  // Reset override when screen size changes significantly
  useEffect(() => { setUserOverride(false); }, [isMobile]);

  const handleRangeChange = (newRange: "90d" | "year") => {
    if (newRange === range) return;
    setUserOverride(true);
    setTransitioning(true);
    setTimeout(() => {
      setRange(newRange);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitioning(false));
      });
    }, 150);
  };

  const days = useMemo(() => buildCalendar(sampleData, activeMetric), [sampleData, activeMetric]);

  const [tooltip, setTooltip] = useState<{ day: DayEntry; x: number; y: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null);
  const [undoInfo, setUndoInfo] = useState<{ date: string; stats: DayStats } | null>(null);
  const [resetDate, setResetDate] = useState<string | null>(null);
  const [longPressDay, setLongPressDay] = useState<{ day: DayEntry; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to end (today) on mobile
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [days]);

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

  const { currentStreak, longestStreak, streakSet } = useMemo(() => {
    let current = 0;
    let longest = 0;
    let streak = 0;
    const inStreak = new Set<string>();

    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) current++;
      else break;
    }

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
    if (streak >= 3) {
      for (let j = runStart; j < days.length; j++) inStreak.add(days[j].date);
    }
    longest = Math.max(longest, streak);

    return { currentStreak: current, longestStreak: longest, streakSet: inStreak };
  }, [days]);

  const filteredDays = useMemo(() => {
    if (range === "year") return days;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return days.filter((d) => d.date >= cutoffStr);
  }, [days, range]);

  const weeks = useMemo(() => {
    const result: DayEntry[][] = [];
    let week: DayEntry[] = [];
    for (const day of filteredDays) {
      if (day.dow === 0 && week.length > 0) {
        result.push(week);
        week = [];
      }
      week.push(day);
    }
    if (week.length > 0) result.push(week);
    return result;
  }, [filteredDays]);

  const totalContributions = useMemo(
    () => filteredDays.reduce((sum, c) => sum + c.count, 0),
    [filteredDays]
  );

  const metricInfo = METRICS.find((m) => m.key === activeMetric)!;

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

  const cellSize = CELL;
  const cellGap = GAP;
  const colWidth = cellSize + cellGap;
  const gridWidth = weeks.length * colWidth - cellGap;

  if (!mounted) {
    return (
      <section className="w-full px-4 py-6 sm:px-10 sm:py-10 bg-background">
        <div className="mx-auto max-w-5xl">
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm font-mono">Loading heatmap…</div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-6 sm:px-10 sm:py-10 bg-background">
      <div className="mx-auto max-w-5xl">
        {/* Header row — stacked on mobile */}
        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight">
              {totalContributions.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm font-mono text-muted-foreground uppercase tracking-wider">
              {metricInfo.short} {range === "90d" ? "last 90 days" : "this year"}
            </span>
          </div>
          <span className="sm:ml-auto flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-mono">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">{currentStreak}d streak</span>
            </span>
            <span className="text-muted-foreground opacity-60">
              best {longestStreak}d
            </span>
          </span>
        </div>

        {/* Metric switcher + range toggle */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setActiveMetric(m.key)}
                className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-colors select-none whitespace-nowrap ${
                  activeMetric === m.key
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex gap-0.5 shrink-0">
            {([["90d", "90d"], ["year", "1y"]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => handleRangeChange(val)}
                className={`px-2 py-1 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-colors select-none ${
                  range === val
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="transition-opacity duration-200 ease-in-out"
          style={{ opacity: transitioning ? 0 : 1 }}
        >
        {isMobile ? (
          <div className="border-2 border-foreground bg-card px-3 py-3 relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-card to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-card to-transparent" />
            <MobileHeatmap
              data={sampleData}
              metric={activeMetric}
              numMonths={range === "90d" ? 3 : 12}
              selectedDate={selectedDay?.date ?? null}
              resetDate={resetDate}
              onDayTap={(day) => setSelectedDay(selectedDay?.date === day.date ? null : day)}
              onDayLongPress={(day) => {
                setSelectedDay(day);
              }}
            />
          </div>
        ) : (
          <div ref={containerRef} className="border-2 border-foreground bg-card relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-card to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-card to-transparent" />
            <div ref={scrollRef} className="overflow-x-auto no-scrollbar overscroll-x-contain scroll-smooth snap-x snap-proximity px-4 py-3">
              {tooltip && (
                <div
                  className="heatmap-tooltip"
                  style={{ left: tooltip.x, top: tooltip.y }}
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
                <div className="flex flex-col shrink-0" style={{ width: DAY_LABEL_WIDTH, gap: cellGap }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => (
                    <div key={i} style={{ height: cellSize }} className="flex items-center">
                      <span className="text-[11px] leading-none text-muted-foreground">
                        {i === 1 || i === 3 || i === 5 ? label : ""}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex" style={{ gap: cellGap }}>
                  {weeks.map((week, wi) => {
                    const isCurrentWeek = week.some((d) => {
                      const now = new Date();
                      const key = now.toISOString().slice(0, 10);
                      return d.date === key;
                    });
                    return (
                      <div
                        key={wi}
                        className={`flex flex-col snap-start${isCurrentWeek ? " bg-foreground/5 -my-1 py-1 rounded-sm" : ""}`}
                        style={{ gap: cellGap }}
                      >
                        {wi === 0 &&
                          Array.from({ length: week[0].dow }).map((_, pi) => (
                            <div key={`pad-${pi}`} style={{ width: cellSize, height: cellSize }} />
                          ))}
                        {week.map((day, di) => (
                          <div
                            key={di}
                            className={`heatmap-cell${streakSet.has(day.date) ? " in-streak" : ""}${selectedDay?.date === day.date ? " ring-2 ring-foreground" : ""}${resetDate === day.date ? " just-reset" : ""}`}
                            data-level={getLevel(day.count, activeMetric)}
                            data-recent={getRecency(day.date)}
                            style={{ width: cellSize, height: cellSize, cursor: "pointer", borderRadius: cellSize > 14 ? 3 : 2 }}
                            onMouseEnter={(e) => handleMouseEnter(e, day)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] font-mono text-muted-foreground">
                <span className="mr-1 font-bold">Less</span>
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <div key={level} className="heatmap-cell heatmap-legend" data-level={level} style={{ width: cellSize, height: cellSize, borderRadius: cellSize > 14 ? 3 : 2 }} />
                ))}
                <span className="ml-1 font-bold">More</span>
              </div>

              {longPressDay && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLongPressDay(null)} onTouchStart={() => setLongPressDay(null)} />
                  <div
                    className="absolute z-50 bg-card border-2 border-foreground shadow-lg flex flex-col min-w-[120px] animate-in fade-in zoom-in-95 duration-150"
                    style={{ left: Math.max(8, longPressDay.x - 60), top: longPressDay.y }}
                  >
                    <button
                      className="px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-left hover:bg-muted transition-colors"
                      onClick={() => {
                        const day = longPressDay.day;
                        setLongPressDay(null);
                        setSelectedDay(day);
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <div className="border-t border-foreground/10" />
                    <button
                      className="px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-left text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => {
                        const date = longPressDay.day.date;
                        const prev = sampleData[date];
                        if (prev) setUndoInfo({ date, stats: { ...prev } });
                        const empty = { doors: 0, conversations: 0, leads: 0, appointments: 0, wins: 0 };
                        setSampleData((p) => ({ ...p, [date]: empty }));
                        setResetDate(date);
                        setTimeout(() => setResetDate(null), 600);
                        setLongPressDay(null);
                      }}
                    >
                      🗑 Reset
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        </div>

        {selectedDay && (
          <DayDetail
            date={selectedDay.date}
            stats={selectedDay.stats}
            open={!!selectedDay}
            onClose={() => setSelectedDay(null)}
            onUpdate={(date, newStats) => {
              setSampleData((prev) => ({ ...prev, [date]: newStats }));
              setSelectedDay((prev) => prev ? { ...prev, stats: newStats, count: newStats[activeMetric] } : null);
            }}
            onReset={(date) => {
              const prev = sampleData[date];
              if (prev) setUndoInfo({ date, stats: { ...prev } });
              const empty = { doors: 0, conversations: 0, leads: 0, appointments: 0, wins: 0 };
              setSampleData((p) => ({ ...p, [date]: empty }));
              setResetDate(date);
              setTimeout(() => setResetDate(null), 600);
            }}
          />
        )}

        {undoInfo && (
          <div className="mt-3 flex items-center justify-between bg-muted border-2 border-foreground px-4 py-2">
            <span className="text-xs font-mono text-muted-foreground">Day reset</span>
            <button
              onClick={() => {
                setSampleData((prev) => ({ ...prev, [undoInfo.date]: undoInfo.stats }));
                setUndoInfo(null);
              }}
              className="text-xs font-mono font-bold uppercase tracking-wider text-foreground hover:opacity-70 transition-opacity"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
