import { createClient } from "jsr:@supabase/supabase-js@2";

import { resolveRequestUser } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { persistMockAnalysis } from "../_shared/mock-analysis.ts";
import {
  isOpenrouterConfigured,
  downloadImageAsBase64,
  analyzeSelfieWithAI,
  type SelfieAnalysisResult,
} from "../_shared/openrouter.ts";

type FinalizePayload = {
  assetId: string;
};

type AnalysisSnapshot = {
  undertone: string;
  contrast: string;
  confidence: number;
  summary: { title: string; description: string };
  focusItems: { title: string; copy: string }[];
  palette: { core: string[]; avoid: string[] };
  recommendations: {
    title: string;
    category: string;
    reason: string;
    score: number;
    price: string;
  }[];
  capturedAt: string;
  sourceSessionId: string;
};

function buildAnalysisSnapshot(
  result: SelfieAnalysisResult,
  sessionId: string,
): AnalysisSnapshot {
  const confidence = Math.round(
    ((result.undertone_confidence + result.contrast_confidence) / 2) * 100,
  ) / 100;

  return {
    undertone: result.undertone_label,
    contrast: result.contrast_label,
    confidence,
    summary: {
      title: `${result.undertone_label} / ${result.contrast_label}`,
      description: result.fit_explanation,
    },
    focusItems: [
      {
        title: "Latest analysis result",
        copy: result.fit_explanation,
      },
      {
        title: "Saved palette",
        copy: `Core colors: ${result.palette_json.core.slice(0, 3).join(", ")}. Avoid: ${result.avoid_colors_json.slice(0, 3).join(", ")}.`,
      },
    ],
    palette: {
      core: result.palette_json.core,
      avoid: result.avoid_colors_json,
    },
    recommendations: result.recommendations.map((item) => ({
      title: item.title,
      category: item.category,
      reason: item.reason,
      score: item.score,
      price: item.price_label,
    })),
    capturedAt: new Date().toISOString(),
    sourceSessionId: sessionId,
  };
}

async function persistAIAnalysis(
  adminClient: ReturnType<typeof createClient>,
  sessionId: string,
  userId: string,
  assetId: string,
  result: SelfieAnalysisResult,
) {
  const analysisSnapshot = buildAnalysisSnapshot(result, sessionId);

  await adminClient
    .from("analysis_sessions")
    .update({
      status: "processing",
      quality_score: result.quality_score,
      light_score: result.light_score,
      confidence_score: Math.round(
        ((result.undertone_confidence + result.contrast_confidence) / 2) * 100
      ) / 100,
      result_json: analysisSnapshot,
    })
    .eq("id", sessionId);

  await adminClient
    .from("style_profiles")
    .upsert(
      {
        user_id: userId,
        undertone_label: result.undertone_label,
        undertone_confidence: result.undertone_confidence,
        contrast_label: result.contrast_label,
        contrast_confidence: result.contrast_confidence,
        palette_json: result.palette_json,
        avoid_colors_json: result.avoid_colors_json,
        fit_explanation: result.fit_explanation,
        analysis_snapshot_json: analysisSnapshot,
        source_analysis_session_id: sessionId,
      },
      { onConflict: "user_id" },
    );

  if (result.recommendations.length > 0) {
    const { data: recommendationSet } = await adminClient
      .from("recommendation_sets")
      .insert({
        user_id: userId,
        analysis_session_id: sessionId,
        context: "home",
        metadata: {
          source: "openrouter-gemini",
          analysis_snapshot: analysisSnapshot,
        },
      })
      .select("id")
      .single();

    if (recommendationSet?.id) {
      await adminClient
        .from("recommendation_items")
        .insert(
          result.recommendations.map((item, index) => ({
            recommendation_set_id: recommendationSet.id,
            title: item.title,
            category: item.category,
            reason: item.reason,
            score: item.score,
            price_label: item.price_label,
            merchant_url: `https://example.com/products/${assetId}/${index}`,
            metadata: {
              source: "openrouter-gemini",
              undertone: analysisSnapshot.undertone,
              contrast: analysisSnapshot.contrast,
              paletteCore: analysisSnapshot.palette.core.slice(0, 4),
            },
          })),
        );
    }
  }

  await adminClient
    .from("analysis_sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);

  // Selfie is no longer needed after analysis — delete from storage to save space.
  const { data: assetRow } = await adminClient
    .from("photo_assets")
    .select("bucket, storage_path")
    .eq("id", assetId)
    .single();

  if (assetRow) {
    await adminClient.storage
      .from(assetRow.bucket)
      .remove([assetRow.storage_path]);
  }

  await adminClient
    .from("photo_assets")
    .update({ status: "deleted", retention_delete_after: new Date().toISOString() })
    .eq("id", assetId);

  return { accepted: true, mode: "openrouter-ai" };
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

  if (isOpenrouterConfigured()) {
    try {
      const { base64, mimeType } = await downloadImageAsBase64(
        adminClient,
        asset.bucket,
        asset.storage_path,
      );

      const result = await analyzeSelfieWithAI(base64, mimeType);
      workerDispatch = await persistAIAnalysis(
        adminClient,
        session.id,
        user.id,
        asset.id,
        result,
      );
    } catch (aiError) {
      console.error("OpenRouter AI analysis failed, falling back to mock:", aiError);
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
