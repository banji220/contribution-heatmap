import React, { useMemo, useState, useRef, useEffect } from "react";

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
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CELL_SIZE = 36;
const GAP = 3;

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

interface MonthData {
  year: number;
  month: number;
  label: string;
  weeks: DayEntry[][];
}

function buildMonths(data: Record<string, DayStats>, metric: MetricKey, numMonths: number): MonthData[] {
  const today = new Date();
  const months: MonthData[] = [];
  const empty: DayStats = { doors: 0, conversations: 0, leads: 0, appointments: 0, wins: 0 };

  for (let m = 0; m < numMonths; m++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();

    const days: DayEntry[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date > today) break;
      const key = date.toISOString().slice(0, 10);
      const stats = data[key] ?? empty;
      days.push({ date: key, dow: date.getDay(), count: stats[metric], stats });
    }

    // Group into weeks
    const weeks: DayEntry[][] = [];
    let week: DayEntry[] = [];
    // Pad start of first week
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
    // Pad last week to 7 days
    if (week.length > 0) {
      while (week.length < 7) {
        week.push({ date: "", dow: week.length, count: -1, stats: empty });
      }
      weeks.push(week);
    }
    // Pad to 6 weeks so all months have the same height
    while (weeks.length < 6) {
      weeks.push(Array.from({ length: 7 }, (_, i) => ({ date: "", dow: i, count: -1, stats: empty })));
    }

    months.push({
      year,
      month,
      label: `${MONTH_NAMES[month]} ${year}`,
      weeks,
    });
  }

  return months;
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

export default function MobileHeatmap({ data, metric, numMonths, onDayTap, onDayLongPress, selectedDate, resetDate }: MobileHeatmapProps) {
  const months = useMemo(() => buildMonths(data, metric, numMonths), [data, metric, numMonths]);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const gridWidth = 7 * CELL_SIZE + 6 * GAP;
  const monthWidth = gridWidth + 24; // grid + padding

  // Auto-scroll to the end (most recent month)
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [months]);

  return (
    <>
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto no-scrollbar scroll-gpu snap-x snap-mandatory scroll-smooth pb-2"
      style={{ touchAction: "pan-x" }}
    >
      {months.map((month) => (
          <div
            key={`${month.year}-${month.month}`}
            className="shrink-0 snap-center"
            style={{ width: gridWidth }}
          >
            <div className="text-xs font-mono font-bold uppercase tracking-wider mb-2 text-center text-muted-foreground">
              {month.label}
            </div>

          {/* DOW headers */}
          <div className="flex" style={{ gap: GAP, marginBottom: GAP }}>
            {DOW_LABELS.map((label, i) => (
              <div
                key={i}
                className="flex items-center justify-center text-[10px] font-mono text-muted-foreground"
                style={{ width: CELL_SIZE, height: 20 }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex flex-col" style={{ gap: GAP }}>
            {month.weeks.map((week, wi) => (
              <div key={wi} className="flex" style={{ gap: GAP }}>
                {week.map((day, di) => {
                  if (day.count === -1) {
                    return <div key={di} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
                  }
                  const level = getLevel(day.count, metric);
                  const isSelected = selectedDate === day.date;
                  const isReset = resetDate === day.date;
                  return (
                    <div
                      key={di}
                      className={`heatmap-cell relative flex items-center justify-center${isSelected ? " ring-2 ring-foreground" : ""}${isReset ? " just-reset" : ""}`}
                      data-level={level}
                      data-recent={getRecency(day.date)}
                      style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 4, cursor: "pointer" }}
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
                        <span className="text-[9px] font-mono font-bold tabular-nums opacity-70 text-background">
                          {day.count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        ))}
    </div>
    </div>

    {/* Legend — outside scroll */}
    <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-muted-foreground pt-2">
      <span className="font-bold">Less</span>
      {[0, 1, 2, 3, 4, 5].map((level) => (
        <div key={level} className="heatmap-cell heatmap-legend" data-level={level} style={{ width: 14, height: 14, borderRadius: 3 }} />
      ))}
      <span className="font-bold">More</span>
    </div>
    <div className="text-center text-[10px] font-mono text-muted-foreground opacity-50 mt-1">
      ← swipe for more months →
    </div>
  </>
  );
}
