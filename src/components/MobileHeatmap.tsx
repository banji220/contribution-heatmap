import React, { useMemo, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DayStats {
  doors: number;
  conversations: number;
  leads: number;
  appointments: number;
  wins: number;
}

type MetricKey = "doors" | "conversations" | "leads" | "wins";

type DayEntry = { date: string; dow: number; count: number; stats: DayStats };

const METRIC_THRESHOLDS: Record<MetricKey, [number, number, number, number]> = {
  doors: [8, 20, 35, 50],
  conversations: [3, 8, 15, 25],
  leads: [1, 3, 6, 10],
  wins: [1, 2, 4, 6],
};

const DOW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const CELL_GAP = 3;

function getLevel(count: number, metric: MetricKey): number {
  if (count === 0) return 0;
  const t = METRIC_THRESHOLDS[metric];
  if (count >= t[3]) return 5;
  if (count >= t[2]) return 4;
  if (count >= t[1]) return 3;
  if (count >= t[0]) return 2;
  return 1;
}

interface MonthData {
  year: number;
  month: number;
  label: string;
  weeks: DayEntry[][];
}

function buildMonth(data: Record<string, DayStats>, metric: MetricKey, year: number, month: number): MonthData {
  const today = new Date();
  const empty: DayStats = { doors: 0, conversations: 0, leads: 0, appointments: 0, wins: 0 };
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const days: DayEntry[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isFuture = date > today;
    const stats = isFuture ? empty : (data[key] ?? empty);
    days.push({ date: key, dow: date.getDay(), count: isFuture ? -1 : stats[metric], stats });
  }

  const weeks: DayEntry[][] = [];
  let week: DayEntry[] = [];
  for (let p = 0; p < firstDow; p++) {
    week.push({ date: "", dow: p, count: -1, stats: empty });
  }
  for (const day of days) {
    if (day.dow === 0 && week.length > 0) {
      weeks.push(week);
      week = [];
    }
    week.push(day);
  }
  if (week.length > 0) {
    while (week.length < 7) {
      week.push({ date: "", dow: week.length, count: -1, stats: empty });
    }
    weeks.push(week);
  }

  return {
    year,
    month,
    label: `${MONTH_NAMES[month]} ${year}`,
    weeks,
  };
}

interface MobileHeatmapProps {
  data: Record<string, DayStats>;
  metric: MetricKey;
  numMonths: number;
  onDayTap: (day: DayEntry) => void;
  onDayLongPress: (day: DayEntry) => void;
  selectedDate: string | null;
  resetDate: string | null;
}

export default function MobileHeatmap({ data, metric, onDayTap, onDayLongPress, selectedDate, resetDate }: MobileHeatmapProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(
    () => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
    [today],
  );

  // Active month state — preserved across edits
  const [active, setActive] = useState<{ year: number; month: number }>({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const monthData = useMemo(
    () => buildMonth(data, metric, active.year, active.month),
    [data, metric, active.year, active.month],
  );

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const goPrev = () => {
    setActive((a) => {
      const d = new Date(a.year, a.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goNext = () => {
    setActive((a) => {
      const d = new Date(a.year, a.month + 1, 1);
      // don't go past current month
      if (d.getFullYear() > today.getFullYear() || (d.getFullYear() === today.getFullYear() && d.getMonth() > today.getMonth())) {
        return a;
      }
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const isAtCurrentMonth = active.year === today.getFullYear() && active.month === today.getMonth();

  return (
    <>
      {/* Month header with arrows */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={goPrev}
          className="p-1.5 hover:bg-muted active:bg-muted rounded transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
          {monthData.label}
        </div>
        <button
          onClick={goNext}
          disabled={isAtCurrentMonth}
          className="p-1.5 hover:bg-muted active:bg-muted rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* DOW headers — full width grid */}
      <div className="grid grid-cols-7 mb-1" style={{ gap: CELL_GAP }}>
        {DOW_LABELS.map((label, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-[10px] font-mono text-muted-foreground h-5"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Weeks — full width grid */}
      <div className="flex flex-col" style={{ gap: CELL_GAP }}>
        {monthData.weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ gap: CELL_GAP }}>
            {week.map((day, di) => {
              if (day.count === -1) {
                return (
                  <div
                    key={di}
                    className="heatmap-cell aspect-square"
                    data-level="0"
                    style={{ borderRadius: 4, opacity: 0.3 }}
                  />
                );
              }
              const level = getLevel(day.count, metric);
              const isSelected = selectedDate === day.date;
              const isReset = resetDate === day.date;
              const isToday = day.date === todayKey;
              return (
                <div
                  key={di}
                  className={`heatmap-cell relative flex items-center justify-center aspect-square${isSelected ? " ring-2 ring-foreground" : ""}${isReset ? " just-reset" : ""}${isToday ? " ring-2 ring-foreground" : ""}`}
                  data-level={level}
                  style={{ borderRadius: 4, cursor: "pointer" }}
                  onClick={() => {
                    if (!didLongPress.current) onDayTap(day);
                  }}
                  onTouchStart={() => {
                    didLongPress.current = false;
                    longPressTimer.current = setTimeout(() => {
                      didLongPress.current = true;
                      longPressTimer.current = null;
                      onDayLongPress(day);
                    }, 400);
                  }}
                  onTouchEnd={(e) => {
                    if (longPressTimer.current) {
                      clearTimeout(longPressTimer.current);
                      longPressTimer.current = null;
                    }
                    if (didLongPress.current) e.preventDefault();
                  }}
                  onTouchMove={() => {
                    if (longPressTimer.current) {
                      clearTimeout(longPressTimer.current);
                      longPressTimer.current = null;
                    }
                  }}
                >
                  {day.count > 0 && (
                    <span className="text-[10px] font-mono font-bold tabular-nums opacity-70 text-background">
                      {day.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-muted-foreground pt-3">
        <span className="font-bold">Less</span>
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className="heatmap-cell heatmap-legend"
            data-level={level}
            style={{ width: 14, height: 14, borderRadius: 3 }}
          />
        ))}
        <span className="font-bold">More</span>
      </div>
    </>
  );
}
