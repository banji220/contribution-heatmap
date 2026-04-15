import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useEffect } from "react";
import ContributionHeatmap from "../components/ContributionHeatmap";
import DailyMission from "../components/DailyMission";
import QuickLog from "../components/QuickLog";
import WeeklyInsights from "../components/WeeklyInsights";
import StreakPanel from "../components/StreakPanel";
import MomentumMeter from "../components/MomentumMeter";
import WeeklyGoal from "../components/WeeklyGoal";
import Achievements from "../components/Achievements";
import TrendView from "../components/TrendView";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

type DayStats = { doors: number; conversations: number; leads: number; appointments: number; wins: number };

function generateSampleData(): Record<string, DayStats> {
  const data: Record<string, DayStats> = {};
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
  const { user, loading, signOut } = useAuth();
  const [statsData, setStatsData] = useState<Record<string, DayStats>>({});
  const [doorsToday, setDoorsToday] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(30);
  const [weeklyTarget, setWeeklyTarget] = useState(150);
  const [displayName, setDisplayName] = useState("");

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Load data
  useEffect(() => {
    if (!user) {
      // Not logged in — show sample data
      setStatsData(generateSampleData());
      return;
    }

    // Fetch real data
    const fetchData = async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const [statsRes, settingsRes, profileRes] = await Promise.all([
        supabase.from("daily_stats").select("*").gte("date", oneYearAgo.toISOString().slice(0, 10)).order("date"),
        supabase.from("user_settings").select("*").maybeSingle(),
        supabase.from("profiles").select("*").maybeSingle(),
      ]);

      if (statsRes.data) {
        const mapped: Record<string, DayStats> = {};
        for (const row of statsRes.data) {
          mapped[row.date] = {
            doors: row.doors,
            conversations: row.conversations,
            leads: row.leads,
            appointments: row.appointments,
            wins: row.wins,
          };
        }
        setStatsData(mapped);
        setDoorsToday(mapped[todayKey]?.doors ?? 0);
      }

      if (settingsRes.data) {
        setDailyTarget(settingsRes.data.daily_target);
        setWeeklyTarget(settingsRes.data.weekly_target);
      }

      if (profileRes.data) {
        setDisplayName(profileRes.data.display_name ?? "");
      }
    };

    fetchData();
  }, [user, todayKey]);

  const handleLog = useCallback(async (count: number) => {
    setDoorsToday((prev) => prev + count);
    // Update local data immediately
    setStatsData((prev) => {
      const existing = prev[todayKey] ?? { doors: 0, conversations: 0, leads: 0, appointments: 0, wins: 0 };
      return { ...prev, [todayKey]: { ...existing, doors: existing.doors + count } };
    });

    if (user) {
      // Persist to database
      const { data: existing } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("date", todayKey)
        .maybeSingle();

      if (existing) {
        await supabase.from("daily_stats").update({ doors: existing.doors + count }).eq("id", existing.id);
      } else {
        await supabase.from("daily_stats").insert({ user_id: user.id, date: todayKey, doors: count });
      }
    }
  }, [user, todayKey]);

  const handleWeeklyTargetChange = useCallback(async (target: number) => {
    setWeeklyTarget(target);
    if (user) {
      await supabase.from("user_settings").update({ weekly_target: target }).eq("user_id", user.id);
    }
  }, [user]);

  // Compute streaks
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
      if ((statsData[keys[i]]?.doors ?? 0) > 0) current++;
      else break;
    }
    let longest = 0;
    let run = 0;
    for (const key of keys) {
      if ((statsData[key]?.doors ?? 0) > 0) run++;
      else { longest = Math.max(longest, run); run = 0; }
    }
    longest = Math.max(longest, run);
    return { currentStreak: current, longestStreak: longest };
  }, [statsData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="font-mono text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="border-b-4 border-foreground px-4 py-3 sm:px-10 sm:py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
              KNOCK TRACKER
            </h1>
            <p className="mt-0.5 text-[10px] sm:text-sm font-mono text-muted-foreground uppercase tracking-widest">
              Every door counts
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-xs font-mono text-muted-foreground">
                  {displayName || user.email}
                </span>
                <button
                  onClick={signOut}
                  className="border-2 border-foreground px-2.5 py-1 text-[10px] sm:text-xs font-mono uppercase tracking-wider hover:bg-muted transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="border-2 border-foreground px-2.5 py-1 text-[10px] sm:text-xs font-mono uppercase tracking-wider hover:bg-muted transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="pt-4 sm:pt-8 space-y-4 sm:space-y-6">
        <QuickLog onLog={handleLog} todayDoors={doorsToday} />
        <WeeklyGoal data={statsData} weeklyTarget={weeklyTarget} onTargetChange={handleWeeklyTargetChange} />
        <DailyMission doorsToday={doorsToday} target={dailyTarget} />
        <WeeklyInsights data={statsData} />
        <StreakPanel currentStreak={currentStreak} longestStreak={longestStreak} />
        <MomentumMeter data={statsData} />
        <TrendView data={statsData} />
        <Achievements doorsToday={doorsToday} currentStreak={currentStreak} longestStreak={longestStreak} weekData={statsData} />
      </div>

      <ContributionHeatmap />
    </div>
  );
}
