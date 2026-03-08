import { createClient } from "jsr:@supabase/supabase-js@2";

import { resolveRequestUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

type PrepareMerchantClickPayload = {
  catalogItemId?: string | null;
  sourceContext?: string | null;
  merchantUrl?: string | null;
  merchantName?: string | null;
  sourceFeed?: string | null;
  productTitle?: string | null;
  currentPlan?: string | null;
  rank?: number | null;
  fitScore?: number | null;
  isPremium?: boolean;
};

function sanitizeText(value: string | null | undefined, maxLength = 120) {
  return value?.trim().slice(0, maxLength) || null;
}

function sanitizeNumber(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Number(value.toFixed(2));
}

function buildTrackedUrl(targetUrl: string, clickId: string, sourceContext: string, sourceFeed: string | null, plan: string | null) {
  let url: URL;

  try {
    url = new URL(targetUrl);
  } catch {
    throw new Error("Merchant URL is invalid");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Merchant URL must use http or https");
  }

  url.searchParams.set("utm_source", "tonematch");
  url.searchParams.set("utm_medium", "mobile_app");
  url.searchParams.set(
    "utm_campaign",
    `${sourceContext}-${sourceFeed ?? "catalog"}`.replace(/[^a-z0-9_-]/gi, "-").toLowerCase(),
  );
  url.searchParams.set("tm_click_id", clickId);

  if (plan) {
    url.searchParams.set("tm_plan", plan.trim().toLowerCase());
  }

  return url.toString();
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

  const body = (await request.json()) as PrepareMerchantClickPayload;
  const targetUrl = sanitizeText(body.merchantUrl, 2048);

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "merchantUrl is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clickId = crypto.randomUUID();
  const sourceContext = sanitizeText(body.sourceContext, 80) ?? "discover";
  const sourceFeed = sanitizeText(body.sourceFeed, 120);
  const currentPlan = sanitizeText(body.currentPlan, 32);
  const resolvedUrl = buildTrackedUrl(targetUrl, clickId, sourceContext, sourceFeed, currentPlan);

  const insertResult = await adminClient
    .from("commerce_click_events")
    .insert({
      id: clickId,
      user_id: user.id,
      catalog_item_id: body.catalogItemId ?? null,
      source_context: sourceContext,
      merchant_name: sanitizeText(body.merchantName, 160),
      source_feed: sourceFeed,
      product_title: sanitizeText(body.productTitle, 160),
      target_url: targetUrl,
      resolved_url: resolvedUrl,
      click_state: "pending",
      details: {
        current_plan: currentPlan,
        rank: typeof body.rank === "number" && Number.isFinite(body.rank) ? Math.max(1, Math.round(body.rank)) : null,
        fit_score: sanitizeNumber(body.fitScore),
        is_premium: Boolean(body.isPremium),
        prepared_from: "mobile-discover",
      },
    })
    .select("id, click_state, target_url, resolved_url, created_at")
    .single();

  if (insertResult.error || !insertResult.data) {
    return new Response(JSON.stringify({ error: insertResult.error?.message ?? "Could not create merchant click event" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      click: insertResult.data,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
