import { createClient } from "jsr:@supabase/supabase-js@2";

import { resolveRequestUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

type ReportMerchantClickPayload = {
  clickId?: string | null;
  clickState?: string | null;
  failureReason?: string | null;
};

const allowedClickStates = new Set(["opened", "blocked", "failed"]);

function sanitizeText(value: string | null | undefined, maxLength = 240) {
  return value?.trim().slice(0, maxLength) || null;
}

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

  const body = (await request.json()) as ReportMerchantClickPayload;
  const clickId = sanitizeText(body.clickId, 64);
  const clickState = sanitizeText(body.clickState, 24)?.toLowerCase();

  if (!clickId || !clickState || !allowedClickStates.has(clickState)) {
    return new Response(JSON.stringify({ error: "Valid clickId and clickState are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const existingEvent = await adminClient
    .from("commerce_click_events")
    .select("id, details, clicked_at")
    .eq("id", clickId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingEvent.error) {
    return new Response(JSON.stringify({ error: existingEvent.error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!existingEvent.data) {
    return new Response(JSON.stringify({ error: "Merchant click event not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const failureReason = sanitizeText(body.failureReason);
  const now = new Date().toISOString();
  const details = {
    ...(existingEvent.data.details ?? {}),
    last_reported_from: "mobile-discover",
    last_reported_state: clickState,
  };

  const updateResult = await adminClient
    .from("commerce_click_events")
    .update({
      click_state: clickState,
      last_attempted_at: now,
      clicked_at: clickState === "opened" ? now : existingEvent.data.clicked_at ?? null,
      failure_reason: clickState === "opened" ? null : failureReason,
      details,
    })
    .eq("id", clickId)
    .eq("user_id", user.id)
    .select("id, click_state, clicked_at, last_attempted_at, failure_reason")
    .single();

  if (updateResult.error || !updateResult.data) {
    return new Response(JSON.stringify({ error: updateResult.error?.message ?? "Could not update merchant click event" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      click: updateResult.data,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
