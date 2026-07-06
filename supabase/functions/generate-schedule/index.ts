import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

interface RecurringRule {
  id: string;
  user_id: string;
  days_of_week: number[];
  start_min: number;
  duration: number;
  label: string;
  category: string;
  active_until: string | null;
}

interface Settings {
  sleep_start: number;
  sleep_end: number;
}

interface ExplicitBlock {
  id: string;
  user_id: string;
  date: string;
  start_min: number;
  duration: number;
  label: string;
  category: string;
  is_recurring: boolean;
  parent_rule_id: string | null;
  archived: boolean;
}

interface BlockOutput {
  id: string;
  user_id: string;
  date: string;
  start_min: number;
  duration: number;
  label: string;
  category: string;
  is_recurring: boolean;
  parent_rule_id: string | null;
  locked: boolean;
}

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    if (!ctx.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = ctx.user.id;
    const { date, timezone } = await req.json();

    if (!date) {
      return Response.json({ error: "date is required" }, { status: 400 });
    }

    const dateStr = date as string;
    const tz = (timezone as string) || "UTC";

    // Fetch user's settings
    const { data: settings, error: settingsError } = await ctx.supabaseAdmin
      .from("settings")
      .select("sleep_start, sleep_end")
      .eq("user_id", userId)
      .single();

    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Settings fetch error:", settingsError);
    }

    const sleepStart = (settings as Settings | null)?.sleep_start ?? 1380;
    const sleepEnd = (settings as Settings | null)?.sleep_end ?? 420;

    // Fetch recurring rules
    const { data: rules, error: rulesError } = await ctx.supabaseAdmin
      .from("recurring_rules")
      .select("*")
      .eq("user_id", userId);

    if (rulesError) {
      console.error("Rules fetch error:", rulesError);
    }

    const recurringRules = (rules as RecurringRule[]) || [];

    // Determine day of week for this date
    const dow = new Date(dateStr + "T12:00:00").getDay();

    // Filter active rules that apply on this day of week
    const activeRules = recurringRules.filter((r) => {
      if (r.active_until && dateStr > r.active_until) return false;
      return r.days_of_week.includes(dow);
    });

    // Fetch explicit blocks for this date
    const { data: explicitBlocks, error: blocksError } = await ctx.supabaseAdmin
      .from("blocks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", dateStr)
      .eq("archived", false);

    if (blocksError) {
      console.error("Blocks fetch error:", blocksError);
    }

    const existingBlocks = (explicitBlocks as ExplicitBlock[]) || [];

    // Collect all blocks: start with non-recurring explicit blocks (exclude sleep — handled separately)
    const resultBlocks: BlockOutput[] = existingBlocks
      .filter((b) => !b.is_recurring && b.category !== "sleep")
      .map((b) => ({
        id: b.id,
        user_id: b.user_id,
        date: b.date,
        start_min: b.start_min,
        duration: b.duration,
        label: b.label,
        category: b.category,
        is_recurring: b.is_recurring,
        parent_rule_id: b.parent_rule_id,
      }));

    // Add recurring blocks for rules that don't have an override
    const overriddenRuleIds = new Set(
      existingBlocks.filter((b) => b.is_recurring && b.parent_rule_id).map((b) => b.parent_rule_id!),
    );

    for (const rule of activeRules) {
      if (overriddenRuleIds.has(rule.id)) {
        // Use the override block instead
        const overrideBlock = existingBlocks.find(
          (b) => b.parent_rule_id === rule.id && b.is_recurring,
        );
        if (overrideBlock) {
          resultBlocks.push({
            id: overrideBlock.id,
            user_id: overrideBlock.user_id,
            date: overrideBlock.date,
            start_min: overrideBlock.start_min,
            duration: overrideBlock.duration,
            label: overrideBlock.label,
            category: overrideBlock.category,
            is_recurring: true,
            parent_rule_id: rule.id,
          });
        }
      } else {
        // Generate block from rule
        resultBlocks.push({
          id: crypto.randomUUID(),
          user_id: userId,
          date: dateStr,
          start_min: rule.start_min,
          duration: rule.duration,
          label: rule.label,
          category: rule.category,
          is_recurring: true,
          parent_rule_id: rule.id,
        });
      }
    }

    // Add/update sleep block (reuse existing ID to avoid duplicates)
    const existingSleepBlock = existingBlocks.find((b) => b.category === "sleep");
    const sleepBlockId = existingSleepBlock?.id ?? crypto.randomUUID();
    let sleepStartMin = sleepStart;
    let sleepDuration: number;

    if (sleepEnd <= sleepStart) {
      // Sleep wraps past midnight
      sleepDuration = 1440 - sleepStart + sleepEnd;
    } else {
      sleepDuration = sleepEnd - sleepStart;
    }

    resultBlocks.push({
      id: sleepBlockId,
      user_id: userId,
      date: dateStr,
      start_min: sleepStartMin,
      duration: sleepDuration,
      label: "Sleep",
      category: "sleep",
      is_recurring: false,
      parent_rule_id: null,
      locked: true,
    });

    return Response.json({ blocks: resultBlocks });
  }),
};
