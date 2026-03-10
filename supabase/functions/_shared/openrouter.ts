/**
 * OpenRouter AI integration for ToneMatch edge functions.
 *
 * Routes:
 *   - Selfie / skin-undertone interpretation -> google/gemini-3-flash-preview
 *   - Clothing-photo visual analysis        -> google/gemini-3.1-flash-lite-preview
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const SELFIE_MODEL = "google/gemini-3-flash-preview";
const CLOTHING_MODEL = "google/gemini-3.1-flash-lite-preview";

function getApiKey(): string {
  return Deno.env.get("OPENROUTER_API_KEY") ?? "";
}

export const openrouterConfigured = Boolean(getApiKey());

/* ------------------------------------------------------------------ */
/*  Generic OpenRouter call                                            */
/* ------------------------------------------------------------------ */

type ImageContent = {
  type: "image_url";
  image_url: { url: string };
};

type TextContent = {
  type: "text";
  text: string;
};

type MessageContent = TextContent | ImageContent;

async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userContent: MessageContent[],
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured.");

  const body = JSON.stringify({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.3,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://tonematch.app",
      "X-Title": "ToneMatch AI",
    },
    body,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`OpenRouter API error ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("OpenRouter returned no content in response.");
  }

  return text;
}

/* ------------------------------------------------------------------ */
/*  Image helpers                                                      */
/* ------------------------------------------------------------------ */

import { createClient } from "jsr:@supabase/supabase-js@2";

export async function downloadImageAsBase64(
  adminClient: ReturnType<typeof createClient>,
  bucket: string,
  storagePath: string,
): Promise<{ base64: string; mimeType: string }> {
  const { data, error } = await adminClient.storage.from(bucket).download(storagePath);

  if (error || !data) {
    throw new Error(`Could not download image: ${error?.message ?? "unknown error"}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);

  const mimeType = storagePath.toLowerCase().endsWith(".png")
    ? "image/png"
    : "image/jpeg";

  return { base64, mimeType };
}

/* ------------------------------------------------------------------ */
/*  Selfie Analysis                                                    */
/* ------------------------------------------------------------------ */

const SELFIE_SYSTEM_PROMPT = `You are a professional color analyst specializing in personal color analysis (seasonal color typing). You analyze selfie photos to determine skin undertone, contrast level, and recommend personalized color palettes.

You must return ONLY valid JSON. Do not include any other text.`;

const SELFIE_USER_PROMPT = `Analyze this selfie photo to determine the person's seasonal color type.

Evaluate carefully:
1. Skin undertone (warm, cool, neutral, or olive - be specific, e.g. "Golden Warm", "Olive Warm", "Rose Cool", "Warm Neutral")
2. Contrast level between skin, hair, and eyes (Deep/High Contrast, Medium Contrast, or Light/Low Contrast)
3. Confidence in your analysis (0.0 to 1.0) - be honest about image quality issues
4. 5-8 specific color names that would look best on this person (core palette)
5. 3-4 neutral colors that work well
6. 2-3 accent colors for statement pieces
7. 3-5 specific color names this person should avoid near the face
8. A clear explanation of why these colors work

Return ONLY valid JSON in this exact format:
{
  "undertone_label": "e.g. Warm Neutral",
  "undertone_confidence": 0.87,
  "contrast_label": "e.g. Medium Contrast",
  "contrast_confidence": 0.81,
  "palette_json": {
    "core": ["Petrol", "Ecru", "Olive", "Warm Navy", "Terracotta"],
    "neutrals": ["Stone", "Mushroom", "Soft Espresso"],
    "accent": ["Rust", "Deep Teal"]
  },
  "avoid_colors_json": ["Icy Grey", "Pure White", "Blue Violet"],
  "fit_explanation": "Warm undertone and medium contrast prefer softened but clear hues around the face. Earth tones and muted warm neutrals create harmony.",
  "quality_score": 0.88,
  "light_score": 0.82,
  "recommendations": [
    {
      "title": "Warm navy overshirt",
      "category": "Outerwear",
      "reason": "Frames the face without flattening warmth.",
      "score": 0.94,
      "price_label": "$88"
    },
    {
      "title": "Ecru heavyweight tee",
      "category": "Top",
      "reason": "Cleaner than stark white and more forgiving near the face.",
      "score": 0.91,
      "price_label": "$44"
    },
    {
      "title": "Olive dinner knit",
      "category": "Occasion",
      "reason": "Adds polish without pushing the skin ashy.",
      "score": 0.89,
      "price_label": "$72"
    }
  ]
}`;

export type SelfieAnalysisResult = {
  undertone_label: string;
  undertone_confidence: number;
  contrast_label: string;
  contrast_confidence: number;
  palette_json: { core: string[]; neutrals: string[]; accent: string[] };
  avoid_colors_json: string[];
  fit_explanation: string;
  quality_score: number;
  light_score: number;
  recommendations: {
    title: string;
    category: string;
    reason: string;
    score: number;
    price_label: string;
  }[];
};

export async function analyzeSelfieWithAI(
  base64: string,
  mimeType: string,
): Promise<SelfieAnalysisResult> {
  const imageUrl = `data:${mimeType};base64,${base64}`;

  const rawJson = await callOpenRouter(SELFIE_MODEL, SELFIE_SYSTEM_PROMPT, [
    { type: "text", text: SELFIE_USER_PROMPT },
    { type: "image_url", image_url: { url: imageUrl } },
  ]);

  const parsed = JSON.parse(rawJson);

  return {
    undertone_label: parsed.undertone_label ?? "Warm Neutral",
    undertone_confidence: Number(parsed.undertone_confidence ?? 0.80),
    contrast_label: parsed.contrast_label ?? "Medium Contrast",
    contrast_confidence: Number(parsed.contrast_confidence ?? 0.75),
    palette_json: {
      core: parsed.palette_json?.core ?? ["Petrol", "Ecru", "Olive"],
      neutrals: parsed.palette_json?.neutrals ?? ["Stone", "Mushroom"],
      accent: parsed.palette_json?.accent ?? ["Rust", "Deep Teal"],
    },
    avoid_colors_json: parsed.avoid_colors_json ?? ["Icy Grey", "Pure White"],
    fit_explanation: parsed.fit_explanation ?? "Analysis complete.",
    quality_score: Number(parsed.quality_score ?? 0.85),
    light_score: Number(parsed.light_score ?? 0.80),
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
  };
}

/* ------------------------------------------------------------------ */
/*  Clothing / Quick Check Analysis                                    */
/* ------------------------------------------------------------------ */

const CLOTHING_SYSTEM_PROMPT = `You are a professional color analyst. You evaluate clothing items against a user's personal color profile. You must return ONLY valid JSON.`;

export type ClothingAnalysisResult = {
  label: string;
  score: number;
  confidence: number;
  best_use: string;
  reason: string;
  color_family: string;
  clothing_check: {
    visible_colors: string[];
    garment_type: string;
    position: string;
    verdict: string;
    explanation: string;
    suggestion: string;
    score: number;
  } | null;
};

export async function analyzeClothingWithAI(
  base64: string,
  mimeType: string,
  profile: {
    undertone_label: string;
    contrast_label: string;
    palette_json: Record<string, unknown>;
    avoid_colors_json: unknown[];
  },
): Promise<ClothingAnalysisResult> {
  const coreColors = Array.isArray((profile.palette_json as { core?: string[] })?.core)
    ? (profile.palette_json as { core: string[] }).core.join(", ")
    : "not yet analyzed";
  const avoidColors = Array.isArray(profile.avoid_colors_json)
    ? profile.avoid_colors_json.join(", ")
    : "not yet analyzed";

  const userPrompt = `The user has the following color profile:
- Undertone: ${profile.undertone_label || "Unknown"}
- Contrast: ${profile.contrast_label || "Unknown"}
- Best colors: ${coreColors}
- Colors to avoid: ${avoidColors}

Analyze this clothing/garment photo and determine how well it matches the user's color profile.

Return ONLY valid JSON:
{
  "label": "Good fit" or "Context dependent" or "Borderline" or "Poor fit",
  "score": 0.85,
  "confidence": 0.90,
  "best_use": "Near face and daily rotation",
  "reason": "This item reads soft-warm and should sit comfortably near the face.",
  "color_family": "warm earthy",
  "clothing_check": {
    "visible_colors": ["Terracotta", "Rust"],
    "garment_type": "Blazer",
    "position": "upper body / near face",
    "verdict": "Complements your undertone well",
    "explanation": "The warm tones harmonize with your golden undertone...",
    "suggestion": "Pair with deep olive bottoms for a complete look.",
    "score": 0.88
  }
}`;

  const imageUrl = `data:${mimeType};base64,${base64}`;

  const rawJson = await callOpenRouter(CLOTHING_MODEL, CLOTHING_SYSTEM_PROMPT, [
    { type: "text", text: userPrompt },
    { type: "image_url", image_url: { url: imageUrl } },
  ]);

  const parsed = JSON.parse(rawJson);

  return {
    label: parsed.label ?? "Analyzed",
    score: Number(parsed.score ?? 0.7),
    confidence: Number(parsed.confidence ?? 0.75),
    best_use: parsed.best_use ?? "Versatile piece",
    reason: parsed.reason ?? "Analysis complete.",
    color_family: parsed.color_family ?? "neutral",
    clothing_check: parsed.clothing_check ?? null,
  };
}

/* ------------------------------------------------------------------ */
/*  Wardrobe Item Analysis                                             */
/* ------------------------------------------------------------------ */

const WARDROBE_SYSTEM_PROMPT = `You are a professional color analyst and wardrobe organizer. You analyze clothing items to classify them by color, style, and usage. You must return ONLY valid JSON.`;

export type WardrobeAnalysisResult = {
  tags: string[];
  note: string;
  fit_score: number;
};

export async function analyzeWardrobeItemWithAI(
  base64: string,
  mimeType: string,
  profile?: {
    undertone_label: string;
    contrast_label: string;
    palette_json: Record<string, unknown>;
    avoid_colors_json: unknown[];
  } | null,
): Promise<WardrobeAnalysisResult> {
  const profileContext = profile
    ? `The user's color profile:
- Undertone: ${profile.undertone_label}
- Contrast: ${profile.contrast_label}
- Best colors: ${Array.isArray((profile.palette_json as { core?: string[] })?.core) ? (profile.palette_json as { core: string[] }).core.join(", ") : "unknown"}
- Colors to avoid: ${Array.isArray(profile.avoid_colors_json) ? profile.avoid_colors_json.join(", ") : "unknown"}`
    : "No user color profile available yet.";

  const userPrompt = `${profileContext}

Analyze this clothing item photo for the user's wardrobe:

1. Identify the garment type and dominant colors
2. Classify with 3-5 tags (e.g. "warm neutral", "smart casual", "safe near face", "borderline", "occasion", "layering piece")
3. Rate how well it fits the user's color profile (0.0 to 1.0)
4. Write a short Turkish note about how to best use this piece

Return ONLY valid JSON:
{
  "tags": ["warm neutral", "smart casual", "safe near face"],
  "note": "Yuz cevresinde sicakligi bozmayan guvenli bir parca.",
  "fit_score": 0.88
}`;

  const imageUrl = `data:${mimeType};base64,${base64}`;

  const rawJson = await callOpenRouter(CLOTHING_MODEL, WARDROBE_SYSTEM_PROMPT, [
    { type: "text", text: userPrompt },
    { type: "image_url", image_url: { url: imageUrl } },
  ]);

  const parsed = JSON.parse(rawJson);

  return {
    tags: Array.isArray(parsed.tags) ? parsed.tags : ["wardrobe", "unclassified"],
    note: parsed.note ?? "Gardroba eklendi.",
    fit_score: Number(parsed.fit_score ?? 0.75),
  };
}
