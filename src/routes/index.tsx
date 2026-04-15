import { createFileRoute } from "@tanstack/react-router";
import ContributionHeatmap from "../components/ContributionHeatmap";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
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

      {/* Heatmap section — untouched grid */}
      <ContributionHeatmap />
    </div>
  );
}
