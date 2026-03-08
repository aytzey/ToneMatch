import { createClient } from "jsr:@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type RevenueCatEventPayload = {
  event?: {
    type?: string;
    app_user_id?: string;
    product_id?: string;
    entitlement_ids?: string[];
    expiration_at_ms?: number | null;
    original_transaction_id?: string;
  };
};

function mapPlan(eventType?: string, productId?: string, entitlements?: string[]) {
  const normalizedType = (eventType ?? "").toUpperCase();
  if (normalizedType === "EXPIRATION" || normalizedType === "REFUND" || normalizedType === "REVOKE") {
    return "free";
  }

  const joined = `${productId ?? ""} ${(entitlements ?? []).join(" ")}`.toLowerCase();
  if (joined.includes("pro")) {
    return "pro";
  }
  if (joined.includes("plus") || joined.includes("premium")) {
    return "plus";
  }
  return "free";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase environment variables" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (webhookSecret) {
    const incoming = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    if (incoming !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Invalid webhook secret" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const payload = (await request.json()) as RevenueCatEventPayload;
  const event = payload.event;

  if (!event?.app_user_id) {
    return new Response(JSON.stringify({ error: "Missing app_user_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const plan = mapPlan(event.type, event.product_id, event.entitlement_ids);
  const periodEndsAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

  const subscriptionResponse = await adminClient
    .from("subscription_states")
    .upsert(
      {
        user_id: event.app_user_id,
        plan,
        provider: "revenuecat",
        provider_customer_id: event.original_transaction_id ?? null,
        period_ends_at: periodEndsAt,
      },
      { onConflict: "user_id" },
    );

  if (subscriptionResponse.error) {
    return new Response(JSON.stringify({ error: subscriptionResponse.error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const eventResponse = await adminClient.from("revenuecat_events").insert({
    user_id: event.app_user_id,
    provider_customer_id: event.original_transaction_id ?? null,
    event_type: event.type ?? "unknown",
    product_id: event.product_id ?? null,
    entitlement_ids: event.entitlement_ids ?? [],
    raw_payload: payload,
  });

  if (eventResponse.error) {
    return new Response(JSON.stringify({ error: eventResponse.error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, plan }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
