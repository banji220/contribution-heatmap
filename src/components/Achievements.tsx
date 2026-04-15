import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";

interface Achievement {
  id: string;
  label: string;
  emoji: string;
  target: number;
  current: (ctx: AchievementContext) => number;
  unit: string;
  check: (ctx: AchievementContext) => boolean;
}

interface AchievementContext {
  doorsToday: number;
  currentStreak: number;
  longestStreak: number;
  totalDoorsWeek: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_knock", label: "First Knock", emoji: "👊", target: 1, unit: "door today", current: (c) => c.doorsToday, check: (c) => c.doorsToday >= 1 },
  { id: "ten_doors", label: "Double Digits", emoji: "🔟", target: 10, unit: "doors today", current: (c) => c.doorsToday, check: (c) => c.doorsToday >= 10 },
  { id: "daily_target", label: "Daily Target Hit", emoji: "🎯", target: 30, unit: "doors today", current: (c) => c.doorsToday, check: (c) => c.doorsToday >= 30 },
  { id: "fifty_doors", label: "50 Door Day", emoji: "💪", target: 50, unit: "doors today", current: (c) => c.doorsToday, check: (c) => c.doorsToday >= 50 },
  { id: "streak_3", label: "3-Day Streak", emoji: "⚡", target: 3, unit: "day streak", current: (c) => c.currentStreak, check: (c) => c.currentStreak >= 3 },
  { id: "streak_7", label: "Week Warrior", emoji: "🔥", target: 7, unit: "day streak", current: (c) => c.currentStreak, check: (c) => c.currentStreak >= 7 },
  { id: "streak_14", label: "Two-Week Terror", emoji: "👑", target: 14, unit: "day streak", current: (c) => c.currentStreak, check: (c) => c.currentStreak >= 14 },
  { id: "week_100", label: "Century Week", emoji: "💯", target: 100, unit: "doors this week", current: (c) => c.totalDoorsWeek, check: (c) => c.totalDoorsWeek >= 100 },
  { id: "week_150", label: "Weekly Goal Crusher", emoji: "🏆", target: 150, unit: "doors this week", current: (c) => c.totalDoorsWeek, check: (c) => c.totalDoorsWeek >= 150 },
];

interface AchievementsProps {
  doorsToday: number;
  currentStreak: number;
  longestStreak: number;
  weekData: Record<string, { doors: number }>;
}

function getWeekTotal(data: Record<string, { doors: number }>): number {
  const today = new Date();
  const dow = today.getDay();
  let total = 0;
  for (let i = 0; i <= dow; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (dow - i));
    const key = d.toISOString().slice(0, 10);
    total += data[key]?.doors ?? 0;
  }
  return total;
}

export default memo(function Achievements({ doorsToday, currentStreak, longestStreak, weekData }: AchievementsProps) {
  const totalDoorsWeek = useMemo(() => getWeekTotal(weekData), [weekData]);
  const ctx: AchievementContext = useMemo(() => ({ doorsToday, currentStreak, longestStreak, totalDoorsWeek }), [doorsToday, currentStreak, longestStreak, totalDoorsWeek]);

  const unlocked = useMemo(() => ACHIEVEMENTS.filter((a) => a.check(ctx)), [ctx]);
  const locked = useMemo(() => ACHIEVEMENTS.filter((a) => !a.check(ctx)), [ctx]);

  // Track newly unlocked for animation
  const [celebrated, setCelebrated] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ id: string; label: string; emoji: string } | null>(null);
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const prevIds = prevUnlockedRef.current;
    const newUnlocks = unlocked.filter((a) => !prevIds.has(a.id) && !celebrated.has(a.id));

    if (newUnlocks.length > 0) {
      const latest = newUnlocks[newUnlocks.length - 1];
      setToast({ id: latest.id, label: latest.label, emoji: latest.emoji });
      setCelebrated((prev) => {
        const next = new Set(prev);
        newUnlocks.forEach((a) => next.add(a.id));
        return next;
      });
      clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 2500);
    }

    prevUnlockedRef.current = new Set(unlocked.map((a) => a.id));
  }, [unlocked, celebrated]);

  const dismissToast = useCallback(() => {
    setToast(null);
    clearTimeout(toastTimeout.current);
  }, []);

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-achievement-in" onClick={dismissToast}>
          <div className="border-2 border-foreground bg-foreground text-background px-5 py-3 flex items-center gap-3 cursor-pointer">
            <span className="text-2xl animate-achievement-bounce">{toast.emoji}</span>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">Achievement Unlocked</div>
              <div className="text-sm font-bold font-mono">{toast.label}</div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements grid */}
      <section className="w-full px-4 sm:px-10 bg-background">
        <div className="mx-auto max-w-5xl">
          <div className="border-2 border-foreground bg-card px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase">Achievements</h2>
              <span className="text-xs font-mono text-muted-foreground">
                {unlocked.length}/{ACHIEVEMENTS.length}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {unlocked.map((a) => (
                <div
                  key={a.id}
                  className={`flex flex-col items-center justify-center py-3 bg-muted ${celebrated.has(a.id) ? "animate-achievement-pop" : ""}`}
                >
                  <span className="text-xl mb-1">{a.emoji}</span>
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-center leading-tight">{a.label}</span>
                </div>
              ))}
              {locked.map((a) => {
                const current = Math.min(a.current(ctx), a.target);
                const pct = Math.round((current / a.target) * 100);
                return (
                  <div key={a.id} className="flex flex-col items-center justify-center py-3 bg-muted/50 border border-border/50 gap-1">
                    <span className="text-lg grayscale opacity-40">{a.emoji}</span>
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold text-center leading-tight text-muted-foreground">
                      {a.label}
                    </span>
                    {/* Progress bar */}
                    <div className="w-4/5 h-1 bg-muted-foreground/15 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full bg-primary/60 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-mono text-muted-foreground/70 leading-tight">
                      {current}/{a.target} {a.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
});
