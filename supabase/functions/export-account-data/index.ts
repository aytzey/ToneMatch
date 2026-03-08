import { createClient } from "jsr:@supabase/supabase-js@2";

import { resolveRequestUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase environment variables" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const user = await resolveRequestUser(request, {
    supabaseUrl,
    supabaseAnonKey,
    adminClient,
  });

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const [profile, sessions, wardrobe, feedback, commerceClicks, quickChecks, subscriptionState, revenuecatEvents] =
    await Promise.all([
      adminClient.from("style_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      adminClient
        .from("analysis_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      adminClient
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      adminClient
        .from("feedback_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      adminClient
        .from("commerce_click_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      adminClient
        .from("quick_check_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      adminClient
        .from("subscription_states")
        .select("plan, provider, period_ends_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      adminClient
        .from("revenuecat_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
  ]);

  const firstError =
    profile.error ??
    sessions.error ??
    wardrobe.error ??
    feedback.error ??
    commerceClicks.error ??
    quickChecks.error ??
    subscriptionState.error ??
    revenuecatEvents.error;

  if (firstError) {
    return new Response(JSON.stringify({ error: firstError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    styleProfile: profile.data,
    analysisSessions: sessions.data ?? [],
    wardrobeItems: wardrobe.data ?? [],
    feedbackEvents: feedback.data ?? [],
    commerceClickEvents: commerceClicks.data ?? [],
    quickCheckResults: quickChecks.data ?? [],
    subscriptionState: subscriptionState.data
      ? {
          plan: subscriptionState.data.plan,
          provider: subscriptionState.data.provider,
          periodEndsAt: subscriptionState.data.period_ends_at,
        }
      : null,
    revenuecatEvents: revenuecatEvents.data ?? [],
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
