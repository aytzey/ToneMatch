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

  const { data: assets, error: assetsError } = await adminClient
    .from("photo_assets")
    .select("bucket, storage_path")
    .eq("user_id", user.id);

  if (assetsError) {
    return new Response(JSON.stringify({ error: assetsError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const grouped = new Map<string, string[]>();
  for (const asset of assets ?? []) {
    const list = grouped.get(asset.bucket) ?? [];
    list.push(asset.storage_path);
    grouped.set(asset.bucket, list);
  }

  for (const [bucket, paths] of grouped.entries()) {
    if (paths.length > 0) {
      await adminClient.storage.from(bucket).remove(paths);
    }
  }

  const { error: deleteDataError } = await adminClient.rpc("delete_user_data", { target_user_id: user.id });
  if (deleteDataError) {
    return new Response(JSON.stringify({ error: deleteDataError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteAuthError) {
    return new Response(JSON.stringify({ error: deleteAuthError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
