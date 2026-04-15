import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import ContributionHeatmap from "../components/ContributionHeatmap";
import DailyMission from "../components/DailyMission";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  // Simulate today's progress — in production, pull from real data
  const { doorsToday, target } = useMemo(() => {
    const hour = new Date().getHours();
    const simulated = Math.min(Math.floor(hour * 1.8 + Math.random() * 5), 40);
    return { doorsToday: simulated, target: 30 };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Bold header strip */}
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

      {/* Daily Mission */}
      <div className="pt-8">
        <DailyMission doorsToday={doorsToday} target={target} />
      </div>

      {/* Heatmap section */}
      <ContributionHeatmap />
    </div>
  );
}
