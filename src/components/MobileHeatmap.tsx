import React, { useMemo, useRef, useState, useLayoutEffect, useEffect } from "react";

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

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_ABBR = ["", "M", "", "W", "", "F", ""];
const GAP = 2;
const NUM_WEEKS = 13;
const DAY_LABEL_WIDTH = 14;

function getLevel(count: number, metric: MetricKey): number {
  if (count === 0) return 0;
  const t = METRIC_THRESHOLDS[metric];
  if (count >= t[3]) return 5;
  if (count >= t[2]) return 4;
  if (count >= t[1]) return 3;
  if (count >= t[0]) return 2;
  return 1;
}

function fmtKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface MobileHeatmapProps {
  data: Record<string, DayStats>;
  metric: MetricKey;
  numMonths?: number;
  onDayTap: (day: DayEntry) => void;
  onDayLongPress: (day: DayEntry) => void;
  selectedDate: string | null;
  resetDate: string | null;
}

export default function MobileHeatmap({ data, metric, onDayTap, onDayLongPress, selectedDate, resetDate }: MobileHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Cell size dynamically calculated to fill width with no scroll
  const cellSize = useMemo(() => {
    if (containerWidth === 0) return 12;
    const available = containerWidth - DAY_LABEL_WIDTH - NUM_WEEKS * GAP + GAP;
    const size = Math.floor(available / NUM_WEEKS);
    return Math.max(8, Math.min(size, 20));
  }, [containerWidth]);

  const { weeks, monthMarkers } = useMemo(() => {
    const empty: DayStats = { doors: 0, conversations: 0, leads: 0, appointments: 0, wins: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - (NUM_WEEKS - 1) * 7);

    const weeks: DayEntry[][] = [];
    const monthMarkers: { col: number; label: string }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < NUM_WEEKS; w++) {
      const week: DayEntry[] = [];
      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(start);
        d.setDate(start.getDate() + w * 7 + dow);
        const isFuture = d > today;
        const key = fmtKey(d);
        const stats = isFuture ? empty : (data[key] ?? empty);
        week.push({
          date: isFuture ? "" : key,
          dow,
          count: isFuture ? -1 : stats[metric],
          stats,
        });
      }
      const firstReal = week.find((d) => d.date) ?? week[0];
      if (firstReal.date) {
        const m = new Date(firstReal.date).getMonth();
        if (m !== lastMonth) {
          monthMarkers.push({ col: w, label: MONTH_ABBR[m] });
          lastMonth = m;
        }
      }
      weeks.push(week);
    }

    return { weeks, monthMarkers };
  }, [data, metric]);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const colWidth = cellSize + GAP;
  const gridWidth = NUM_WEEKS * cellSize + (NUM_WEEKS - 1) * GAP;

  return (
    <div ref={containerRef} className="w-full">
      {/* Month labels */}
      <div className="relative" style={{ height: 12, marginLeft: DAY_LABEL_WIDTH, width: gridWidth }}>
        {monthMarkers.map((m, i) => {
          const tooClose = i > 0 && (m.col - monthMarkers[i - 1].col) < 3;
          if (tooClose) return null;
          return (
            <span
              key={i}
              className="absolute top-0 text-[9px] font-mono text-muted-foreground leading-none"
              style={{ left: m.col * colWidth }}
            >
              {m.label}
            </span>
          );
        })}
      </div>

      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col shrink-0" style={{ width: DAY_LABEL_WIDTH, gap: GAP }}>
          {DAY_ABBR.map((label, i) => (
            <div key={i} style={{ height: cellSize }} className="flex items-center">
              <span className="text-[8px] font-mono text-muted-foreground leading-none">{label}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex" style={{ gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
              {week.map((day, di) => {
                if (day.count === -1) {
                  return (
                    <div
                      key={di}
                      className="heatmap-cell"
                      data-level="0"
                      style={{ width: cellSize, height: cellSize, borderRadius: 2, opacity: 0.3 }}
                    />
                  );
                }
                const level = getLevel(day.count, metric);
                const isSelected = selectedDate === day.date;
                const isReset = resetDate === day.date;
                return (
                  <div
                    key={di}
                    className={`heatmap-cell${isSelected ? " ring-1 ring-foreground" : ""}${isReset ? " just-reset" : ""}`}
                    data-level={level}
                    style={{ width: cellSize, height: cellSize, borderRadius: 2, cursor: "pointer" }}
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
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-muted-foreground pt-3">
        <span className="font-bold">Less</span>
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className="heatmap-cell heatmap-legend"
            data-level={level}
            style={{ width: 12, height: 12, borderRadius: 2 }}
          />
        ))}
        <span className="font-bold">More</span>
      </div>
    </div>
  );
}
