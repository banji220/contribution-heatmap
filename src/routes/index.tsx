import { createFileRoute } from "@tanstack/react-router";
import ContributionHeatmap from "../components/ContributionHeatmap";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <ContributionHeatmap />
    </div>
  );
}
