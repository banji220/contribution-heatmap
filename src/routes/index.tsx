import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useEffect } from "react";
import ContributionHeatmap from "../components/ContributionHeatmap";
import DailyMission from "../components/DailyMission";
import QuickLog from "../components/QuickLog";
import WeeklyInsights from "../components/WeeklyInsights";
import StreakPanel from "../components/StreakPanel";

export const Route = createFileRoute("/")({
  component: Index,
});

function generateSampleData(): Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }> {
  const data: Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }> = {};
  const today = new Date();
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const d = new Date(oneYearAgo);
  while (d <= today) {
    const key = d.toISOString().slice(0, 10);
    const isWeekday = d.getDay() >= 1 && d.getDay() <= 5;
    const rand = Math.random();
    let doors = 0;
    if (isWeekday) {
      if (rand > 0.15) doors = Math.floor(Math.random() * 20) + 5;
      if (rand > 0.5) doors = Math.floor(Math.random() * 30) + 15;
      if (rand > 0.85) doors = Math.floor(Math.random() * 40) + 30;
    } else {
      if (rand > 0.5) doors = Math.floor(Math.random() * 10) + 1;
      if (rand > 0.8) doors = Math.floor(Math.random() * 15) + 5;
    }
    const conversations = doors > 0 ? Math.floor(doors * (0.3 + Math.random() * 0.3)) : 0;
    const leads = conversations > 0 ? Math.floor(conversations * (0.2 + Math.random() * 0.4)) : 0;
    const appointments = leads > 0 ? Math.floor(leads * (0.3 + Math.random() * 0.4)) : 0;
    const wins = appointments > 0 ? Math.floor(appointments * (0.2 + Math.random() * 0.5)) : 0;
    data[key] = { doors, conversations, leads, appointments, wins };
    d.setDate(d.getDate() + 1);
  }
  return data;
}

function Index() {
  const [sampleData, setSampleData] = useState<Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }>>({});
  useEffect(() => { setSampleData(generateSampleData()); }, []);

  // Compute streaks from sample data
  const { currentStreak, longestStreak } = useMemo(() => {
    const today = new Date();
    const keys: string[] = [];
    const d = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    while (d <= today) {
      keys.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    let current = 0;
    for (let i = keys.length - 1; i >= 0; i--) {
      if ((sampleData[keys[i]]?.doors ?? 0) > 0) current++;
      else break;
    }
    let longest = 0;
    let run = 0;
    for (const key of keys) {
      if ((sampleData[key]?.doors ?? 0) > 0) { run++; }
      else { longest = Math.max(longest, run); run = 0; }
    }
    longest = Math.max(longest, run);
    return { currentStreak: current, longestStreak: longest };
  }, [sampleData]);

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
        <WeeklyInsights data={sampleData} />
        <StreakPanel currentStreak={currentStreak} longestStreak={longestStreak} />
      </div>

      <ContributionHeatmap />
    </div>
  );
}
