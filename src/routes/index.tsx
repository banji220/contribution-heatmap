import { createFileRoute } from "@tanstack/react-router";
import ContributionHeatmap from "../components/ContributionHeatmap";
import StatsCards from "../components/StatsCards";
import FeaturesSection from "../components/FeaturesSection";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-xl animate-bounce-soft">
              🚪
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Knock Tracker
              </h1>
            </div>
          </div>
          <div className="bg-secondary rounded-full px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            2025
          </div>
        </div>
      </header>

      {/* Heatmap section — untouched grid */}
      <ContributionHeatmap />

      {/* Stats cards */}
      <StatsCards />

      {/* Features */}
      <FeaturesSection />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
