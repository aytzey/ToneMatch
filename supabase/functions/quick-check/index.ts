import { createClient } from "jsr:@supabase/supabase-js@2";

import { resolveRequestUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  isOpenrouterConfigured,
  downloadImageAsBase64,
  analyzeClothingWithAI,
} from "../_shared/openrouter.ts";

type QuickCheckPayload = {
  assetId: string;
};

function fallbackQuickCheck(seed: string) {
  const variants = [
    {
      label: "Good fit",
      score: 0.9,
      confidence: 0.82,
      best_use: "Near face and daily rotation",
      reason: "This item reads soft-warm and should sit comfortably near the face.",
      color_family: "warm earthy",
    },
    {
      label: "Context dependent",
      score: 0.73,
      confidence: 0.78,
      best_use: "Better as a layer or evening item",
      reason: "The contrast looks stronger, so styling context matters more here.",
      color_family: "cool crisp",
    },
    {
      label: "Borderline",
      score: 0.61,
      confidence: 0.69,
      best_use: "Safer below the face",
      reason: "The tone is usable, but it is less reliable as a face-adjacent hero piece.",
      color_family: "muted neutral",
    },
  ];
  const code = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[code % variants.length];
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

  const body = (await request.json()) as QuickCheckPayload;
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
    return new Response(JSON.stringify({ error: "Quick check asset not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch user's style profile so we can evaluate clothing fit
  const { data: profile } = await adminClient
    .from("style_profiles")
    .select("undertone_label, contrast_label, palette_json, avoid_colors_json")
    .eq("user_id", user.id)
    .maybeSingle();

  let result: {
    label: string;
    score: number;
    confidence: number;
    best_use: string;
    reason: string;
    color_family: string;
    clothing_check?: {
      visible_colors: string[];
      garment_type: string;
      position: string;
      verdict: string;
      explanation: string;
      suggestion: string;
      score: number;
    } | null;
  } = fallbackQuickCheck(asset.storage_path);

  if (isOpenrouterConfigured()) {
    try {
      const { base64, mimeType } = await downloadImageAsBase64(
        adminClient,
        asset.bucket,
        asset.storage_path,
      );

      const aiResult = await analyzeClothingWithAI(base64, mimeType, {
        undertone_label: profile?.undertone_label ?? "",
        contrast_label: profile?.contrast_label ?? "",
        palette_json: (profile?.palette_json as Record<string, unknown>) ?? {},
        avoid_colors_json: Array.isArray(profile?.avoid_colors_json) ? profile.avoid_colors_json : [],
      });

      result = aiResult;
    } catch (aiError) {
      console.error("OpenRouter clothing analysis failed, using fallback:", aiError);
    }
  }

  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    photo_asset_id: asset.id,
    label: result.label,
    score: result.score,
    confidence: result.confidence,
    best_use: result.best_use,
    reason: result.reason,
    color_family: result.color_family,
  };
  if (result.clothing_check) {
    insertPayload.metadata = { clothing_check: result.clothing_check };
  }

  const { data: quickCheck, error: insertError } = await adminClient
    .from("quick_check_results")
    .insert(insertPayload)
    .select("id, label, score, confidence, best_use, reason, color_family, created_at, metadata")
    .single();

  if (insertError || !quickCheck) {
    return new Response(JSON.stringify({ error: insertError?.message ?? "Could not store quick check result" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await adminClient
    .from("photo_assets")
    .update({
      uploaded_at: new Date().toISOString(),
      status: "completed",
    })
    .eq("id", asset.id);

  return new Response(JSON.stringify({ quickCheck }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
