import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Get all daily stats for the authenticated user (last year)
export const getDailyStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data, error } = await context.supabase
      .from("daily_stats")
      .select("*")
      .eq("user_id", context.userId)
      .gte("date", oneYearAgo.toISOString().slice(0, 10))
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching daily stats:", error);
      return { stats: [], error: error.message };
    }
    return { stats: data ?? [], error: null };
  });

// Log doors (upsert today's stats)
export const logDoors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { count: number; date: string }) => data)
  .handler(async ({ context, data }) => {
    // First try to get existing record
    const { data: existing } = await context.supabase
      .from("daily_stats")
      .select("*")
      .eq("user_id", context.userId)
      .eq("date", data.date)
      .maybeSingle();

    if (existing) {
      const { error } = await context.supabase
        .from("daily_stats")
        .update({ doors: existing.doors + data.count })
        .eq("id", existing.id);

      if (error) return { error: error.message };
      return { doors: existing.doors + data.count, error: null };
    } else {
      const { error } = await context.supabase
        .from("daily_stats")
        .insert({ user_id: context.userId, date: data.date, doors: data.count });

      if (error) return { error: error.message };
      return { doors: data.count, error: null };
    }
  });

// Update a day's full stats
export const updateDayStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { date: string; doors?: number; conversations?: number; leads?: number; appointments?: number; wins?: number; notes?: string }) => data)
  .handler(async ({ context, data }) => {
    const { date, ...updates } = data;

    const { data: existing } = await context.supabase
      .from("daily_stats")
      .select("id")
      .eq("user_id", context.userId)
      .eq("date", date)
      .maybeSingle();

    if (existing) {
      const { error } = await context.supabase
        .from("daily_stats")
        .update(updates)
        .eq("id", existing.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await context.supabase
        .from("daily_stats")
        .insert({ user_id: context.userId, date, ...updates });
      if (error) return { error: error.message };
    }
    return { error: null };
  });

// Get user settings
export const getUserSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) return { settings: null, error: error.message };
    return { settings: data, error: null };
  });

// Update user settings
export const updateUserSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { daily_target?: number; weekly_target?: number }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("user_settings")
      .update(data)
      .eq("user_id", context.userId);

    if (error) return { error: error.message };
    return { error: null };
  });

// Get user profile
export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) return { profile: null, error: error.message };
    return { profile: data, error: null };
  });
