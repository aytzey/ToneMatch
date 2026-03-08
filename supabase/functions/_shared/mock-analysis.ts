import { SupabaseClient } from "jsr:@supabase/supabase-js@2";

const profiles = [
  {
    undertone_label: "Warm Neutral",
    undertone_confidence: 0.87,
    contrast_label: "Medium Contrast",
    contrast_confidence: 0.81,
    palette_json: {
      core: ["Petrol", "Ecru", "Olive", "Warm Navy"],
      neutrals: ["Stone", "Mushroom", "Soft Espresso"],
      accent: ["Rust", "Deep Teal"],
    },
    avoid_colors_json: ["Icy Grey", "Pure White", "Blue Violet"],
    fit_explanation: "Warm undertone and medium contrast prefer softened but clear hues around the face.",
    products: [
      {
        title: "Warm navy overshirt",
        category: "Outerwear",
        reason: "Frames the face without flattening warmth.",
        score: 0.94,
        price_label: "$88",
      },
      {
        title: "Ecru heavyweight tee",
        category: "Top",
        reason: "Cleaner than stark white and more forgiving near the face.",
        score: 0.91,
        price_label: "$44",
      },
      {
        title: "Olive dinner knit",
        category: "Occasion",
        reason: "Adds polish without pushing the skin ashy.",
        score: 0.89,
        price_label: "$72",
      },
    ],
  },
  {
    undertone_label: "Cool Bright",
    undertone_confidence: 0.9,
    contrast_label: "High Contrast",
    contrast_confidence: 0.84,
    palette_json: {
      core: ["Ink Blue", "True White", "Berry", "Blue Red"],
      neutrals: ["Charcoal", "Cool Taupe", "Graphite"],
      accent: ["Emerald", "Cobalt"],
    },
    avoid_colors_json: ["Dusty Beige", "Muted Olive", "Warm Camel"],
    fit_explanation: "Cool undertones with brightness need crisp contrast and cleaner chroma.",
    products: [
      {
        title: "Cobalt shirt jacket",
        category: "Outerwear",
        reason: "Sharpens contrast and keeps the complexion clear.",
        score: 0.95,
        price_label: "$112",
      },
      {
        title: "True white poplin shirt",
        category: "Top",
        reason: "Supports a bright profile instead of dulling it.",
        score: 0.92,
        price_label: "$64",
      },
      {
        title: "Berry structured knit",
        category: "Occasion",
        reason: "Adds polish without turning muddy under evening light.",
        score: 0.9,
        price_label: "$89",
      },
    ],
  },
];

function pickProfile(seed: string) {
  const code = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return profiles[code % profiles.length];
}

export async function persistMockAnalysis(
  adminClient: SupabaseClient,
  sessionId: string,
  userId: string,
  assetId: string,
) {
  const profile = pickProfile(sessionId);

  await adminClient
    .from("analysis_sessions")
    .update({
      status: "processing",
      quality_score: 0.88,
      light_score: 0.82,
      confidence_score: 0.86,
    })
    .eq("id", sessionId);

  await adminClient
    .from("style_profiles")
    .upsert({
      user_id: userId,
      undertone_label: profile.undertone_label,
      undertone_confidence: profile.undertone_confidence,
      contrast_label: profile.contrast_label,
      contrast_confidence: profile.contrast_confidence,
      palette_json: profile.palette_json,
      avoid_colors_json: profile.avoid_colors_json,
      fit_explanation: profile.fit_explanation,
      source_analysis_session_id: sessionId,
    }, { onConflict: "user_id" });

  const { data: recommendationSet } = await adminClient
    .from("recommendation_sets")
    .insert({
      user_id: userId,
      analysis_session_id: sessionId,
      context: "home",
    })
    .select("id")
    .single();

  if (recommendationSet?.id) {
    await adminClient
      .from("recommendation_items")
      .insert(
        profile.products.map((item, index) => ({
          recommendation_set_id: recommendationSet.id,
          title: item.title,
          category: item.category,
          reason: item.reason,
          score: item.score,
          price_label: item.price_label,
          merchant_url: `https://example.com/products/${assetId}/${index}`,
          metadata: { source: "supabase-function-fallback" },
        })),
      );
  }

  await adminClient
    .from("analysis_sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);

  await adminClient
    .from("photo_assets")
    .update({ status: "completed" })
    .eq("id", assetId);

  return { accepted: true, mode: "function-fallback" };
}
