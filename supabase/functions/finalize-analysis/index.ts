import { createClient } from "jsr:@supabase/supabase-js@2";

import { resolveRequestUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { persistMockAnalysis } from "../_shared/mock-analysis.ts";

type FinalizePayload = {
  assetId: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const workerUrl = Deno.env.get("AI_WORKER_URL");
  const workerSecret = Deno.env.get("AI_WORKER_SHARED_SECRET");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase environment variables" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = (await request.json()) as FinalizePayload;
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

  const { data: asset, error: assetError } = await adminClient
    .from("photo_assets")
    .select("id, bucket, storage_path")
    .eq("id", body.assetId)
    .eq("user_id", user.id)
    .single();

  if (assetError || !asset) {
    return new Response(JSON.stringify({ error: "Photo asset not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: session, error: sessionError } = await adminClient
    .from("analysis_sessions")
    .insert({
      user_id: user.id,
      photo_asset_id: asset.id,
      status: "queued",
    })
    .select("id, status, created_at")
    .single();

  if (sessionError || !session) {
    return new Response(JSON.stringify({ error: sessionError?.message ?? "Could not create session" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await adminClient
    .from("photo_assets")
    .update({
      uploaded_at: new Date().toISOString(),
      status: "queued",
    })
    .eq("id", asset.id);

  let workerDispatch = { accepted: false, mode: "not-configured" };

  if (workerUrl && workerSecret) {
    const workerResponse = await fetch(`${workerUrl}/jobs/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-shared-secret": workerSecret,
      },
      body: JSON.stringify({
        session_id: session.id,
        user_id: user.id,
        asset_id: asset.id,
        bucket: asset.bucket,
        storage_path: asset.storage_path,
      }),
    });

    if (workerResponse.ok) {
      workerDispatch = { accepted: true, mode: "worker" };
    } else {
      workerDispatch = await persistMockAnalysis(adminClient, session.id, user.id, asset.id);
    }
  } else {
    workerDispatch = await persistMockAnalysis(adminClient, session.id, user.id, asset.id);
  }

  return new Response(JSON.stringify({ session, workerDispatch }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
