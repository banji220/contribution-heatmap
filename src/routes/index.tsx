import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import ContributionHeatmap from "../components/ContributionHeatmap";
import DailyMission from "../components/DailyMission";
import QuickLog from "../components/QuickLog";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const initialDoors = useMemo(() => {
    const hour = new Date().getHours();
    return Math.min(Math.floor(hour * 1.8 + Math.random() * 5), 40);
  }, []);

  const [doorsToday, setDoorsToday] = useState(initialDoors);
  const target = 30;

  const handleLog = useCallback((count: number) => {
    setDoorsToday((prev) => prev + count);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-4 border-foreground px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-5xl items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              KNOCK TRACKER
            </h1>
            <p className="mt-1 text-sm font-mono text-muted-foreground uppercase tracking-widest">
              Every door counts
            </p>
          </div>
          <div className="hidden sm:block border-2 border-foreground px-3 py-1 text-xs font-mono uppercase tracking-wider">
            2025
          </div>
        </div>
      </header>

      <div className="pt-8 space-y-6">
        <QuickLog onLog={handleLog} todayDoors={doorsToday} />
        <DailyMission doorsToday={doorsToday} target={target} />
      </div>

      <ContributionHeatmap />
    </div>
  );
}
