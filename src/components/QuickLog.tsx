import { useState, useCallback, useRef, memo } from "react";

interface QuickLogProps {
  onLog: (count: number) => void;
  todayDoors: number;
}

export default memo(function QuickLog({ onLog, todayDoors }: QuickLogProps) {
  const [flash, setFlash] = useState(false);
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const quickAdd = useCallback((amount: number) => {
    onLog(amount);
    setLastAdded(amount);
    setFlash(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFlash(false);
      setLastAdded(null);
    }, 600);
  }, [onLog]);

  return (
    <section className="w-full px-4 sm:px-10 bg-background">
      <div className="mx-auto max-w-5xl">
        <div className="border-2 border-foreground bg-card px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase">Quick Log</h2>
            <span className="font-mono text-sm text-muted-foreground">
              Today: <span className="font-bold text-foreground">{todayDoors}</span>
            </span>
          </div>

          {/* Big tap buttons */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {[1, 5, 10, 25].map((n) => (
              <button
                key={n}
                onClick={() => quickAdd(n)}
                className="relative flex flex-col items-center justify-center py-5 sm:py-5 bg-muted text-foreground font-bold text-2xl sm:text-2xl font-mono active:scale-95 transition-transform duration-100 select-none touch-manipulation hover:bg-secondary"
              >
                +{n}
                <span className="text-[9px] sm:text-xs font-normal text-muted-foreground mt-0.5">
                  {n === 1 ? "door" : "doors"}
                </span>
              </button>
            ))}
          </div>

          {/* Flash feedback */}
          <div
            className={`mt-2 h-6 sm:h-8 flex items-center justify-center font-mono text-xs sm:text-sm font-bold transition-opacity duration-300 ${
              flash ? "opacity-100" : "opacity-0"
            }`}
          >
            {lastAdded && (
              <span>
                ✓ Logged {lastAdded} {lastAdded === 1 ? "door" : "doors"}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});
