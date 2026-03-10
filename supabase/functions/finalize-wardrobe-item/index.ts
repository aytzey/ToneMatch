import { createClient } from "jsr:@supabase/supabase-js@2";

import { resolveRequestUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  openrouterConfigured,
  downloadImageAsBase64,
  analyzeWardrobeItemWithAI,
} from "../_shared/openrouter.ts";

type FinalizeWardrobePayload = {
  assetId: string;
  name?: string;
};

function inferWardrobeTags(seed: string) {
  const profiles = [
    {
      tags: ["warm neutral", "smart casual", "safe near face"],
      note: "Yuz cevresinde sicakligi bozmayan guvenli bir parca olarak etiketlendi.",
      fitScore: 0.9,
    },
    {
      tags: ["borderline", "better as base", "cool leaning"],
      note: "Tek basina degil, katman parcasi olarak daha guclu calisir.",
      fitScore: 0.74,
    },
    {
      tags: ["occasion", "deep tone", "easy contrast"],
      note: "Aksam ve event kullaniminda daha rafine duran ton grubuna yakin.",
      fitScore: 0.86,
    },
  ];

  const code = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return profiles[code % profiles.length];
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

  const body = (await request.json()) as FinalizeWardrobePayload;
  const { data: asset, error: assetError } = await adminClient
    .from("photo_assets")
    .select("id, bucket, storage_path, file_name")
    .eq("id", body.assetId)
    .eq("user_id", user.id)
    .single();

  if (assetError || !asset) {
    return new Response(JSON.stringify({ error: "Wardrobe asset not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Try AI analysis, fall back to deterministic
  let derived: { tags: string[]; note: string; fitScore: number };

  if (openrouterConfigured) {
    try {
      // Fetch user's style profile for context
      const { data: profile } = await adminClient
        .from("style_profiles")
        .select("undertone_label, contrast_label, palette_json, avoid_colors_json")
        .eq("user_id", user.id)
        .maybeSingle();

      const { base64, mimeType } = await downloadImageAsBase64(
        adminClient,
        asset.bucket,
        asset.storage_path,
      );

      const aiResult = await analyzeWardrobeItemWithAI(
        base64,
        mimeType,
        profile
          ? {
              undertone_label: profile.undertone_label,
              contrast_label: profile.contrast_label,
              palette_json: (profile.palette_json as Record<string, unknown>) ?? {},
              avoid_colors_json: Array.isArray(profile.avoid_colors_json) ? profile.avoid_colors_json : [],
            }
          : null,
      );

      derived = {
        tags: aiResult.tags,
        note: aiResult.note,
        fitScore: aiResult.fit_score,
      };
    } catch (aiError) {
      console.error("OpenRouter wardrobe analysis failed, using fallback:", aiError);
      derived = inferWardrobeTags(asset.storage_path);
    }
  } else {
    derived = inferWardrobeTags(asset.storage_path);
  }

  const { data: wardrobeItem, error: wardrobeError } = await adminClient
    .from("wardrobe_items")
    .insert({
      user_id: user.id,
      photo_asset_id: asset.id,
      name: body.name ?? asset.file_name ?? "Wardrobe item",
      note: derived.note,
      color_tags: derived.tags,
      fit_score: derived.fitScore,
      usage_contexts: ["wardrobe-match", "layering"],
    })
    .select("id, name, note, color_tags, fit_score, created_at")
    .single();

  if (wardrobeError || !wardrobeItem) {
    return new Response(JSON.stringify({ error: wardrobeError?.message ?? "Could not finalize wardrobe item" }), {
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

  return new Response(JSON.stringify({ wardrobeItem }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
