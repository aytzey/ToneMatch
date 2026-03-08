import { createClient } from "jsr:@supabase/supabase-js@2";

import { resolveRequestUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

type CreateUploadPayload = {
  fileName: string;
  contentType: string;
  kind?: "selfie" | "wardrobe";
};

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

  const body = (await request.json()) as CreateUploadPayload;
  const safeName = body.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const bucket = body.kind === "wardrobe" ? "wardrobe" : "selfies";
  const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { data: uploadData, error: uploadError } = await adminClient.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath);

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: asset, error: assetError } = await adminClient
    .from("photo_assets")
    .insert({
      user_id: user.id,
      bucket,
      storage_path: storagePath,
      kind: body.kind ?? "selfie",
      content_type: body.contentType,
      file_name: body.fileName,
    })
    .select("id, bucket, storage_path, status")
    .single();

  if (assetError) {
    return new Response(JSON.stringify({ error: assetError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ asset, upload: uploadData }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
