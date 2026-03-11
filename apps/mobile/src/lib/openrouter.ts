/**
 * OpenRouter AI client for ToneMatch mobile (fallback when backend is unavailable).
 *
 * Routes all AI through OpenRouter:
 *   - Selfie / skin-undertone -> google/gemini-3-flash-preview
 *   - Clothing analysis       -> google/gemini-3.1-flash-lite-preview
 */

import { File } from "expo-file-system";

import type { ClothingCheck, StyleExperience } from "@/src/types/tonematch";

const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SELFIE_MODEL = "google/gemini-3-flash-preview";
const CLOTHING_MODEL = "google/gemini-3.1-flash-lite-preview";

export const openrouterConfigured = Boolean(API_KEY);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function imageUriToBase64(uri: string): Promise<string> {
  const file = new File(uri);
  return file.base64();
}

type MessageContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userContent: MessageContent[],
): Promise<string> {
  if (!API_KEY) throw new Error("OPENROUTER_API_KEY is not configured.");

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

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": "https://tonematch.app",
      "X-Title": "ToneMatch Mobile",
    },
    body,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`OpenRouter error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("OpenRouter returned no content.");
  }

  return text;
}

/* ------------------------------------------------------------------ */
/*  Selfie Analysis                                                    */
/* ------------------------------------------------------------------ */

export type SelfieAnalysisResult = {
  undertone: string;
  contrast: string;
  confidence: number;
  seasonalType: string;
  summaryTitle: string;
  summaryDescription: string;
  coreColors: string[];
  avoidColors: string[];
  focusItems: { title: string; copy: string }[];
};

const SELFIE_SYSTEM = "You are a professional color analyst specializing in personal color analysis (seasonal color typing). You analyze selfie photos to determine skin undertone, contrast level, and recommend personalized color palettes. Return ONLY valid JSON.";

const SELFIE_PROMPT = `Analyze this selfie photo to determine the person's seasonal color type.

Evaluate:
1. Skin undertone (warm, cool, or neutral — be specific, e.g. "Golden Warm", "Olive Warm", "Rose Cool")
2. Contrast level between skin, hair, and eyes (Deep, Medium, or Light)
3. Seasonal color type (e.g. Deep Autumn, Soft Summer, Bright Spring, Cool Winter, etc.)
4. Confidence in your analysis (0.0 to 1.0)
5. 5-8 specific color names that would look best on this person
6. 3-5 specific color names this person should avoid
7. A summary title and description explaining the analysis
8. 2-3 focus items with styling advice

Return ONLY valid JSON:
{
  "undertone": "e.g. Golden Warm",
  "contrast": "e.g. Deep Contrast",
  "confidence": 0.92,
  "seasonalType": "e.g. Deep Autumn",
  "summaryTitle": "Golden Warm / Deep Contrast",
  "summaryDescription": "Your skin features rich golden undertones...",
  "coreColors": ["Rust", "Deep Olive", "Forest Green", "Burgundy", "Terracotta"],
  "avoidColors": ["Cool Blue", "Lavender", "Icy Pink"],
  "focusItems": [
    {"title": "Why this works for you", "copy": "Your warm undertone and deep contrast..."},
    {"title": "Styling tip", "copy": "Opt for earth tones and warm metallics..."}
  ]
}`;

export async function analyzeSelfie(imageUri: string): Promise<SelfieAnalysisResult> {
  const base64 = await imageUriToBase64(imageUri);
  const mimeType = imageUri.toLowerCase().includes(".png") ? "image/png" : "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const rawJson = await callOpenRouter(SELFIE_MODEL, SELFIE_SYSTEM, [
    { type: "text", text: SELFIE_PROMPT },
    { type: "image_url", image_url: { url: dataUrl } },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("OpenRouter returned invalid JSON for selfie analysis.");
  }

  return {
    undertone: parsed.undertone ?? "Warm",
    contrast: parsed.contrast ?? "Medium Contrast",
    confidence: Number(parsed.confidence ?? 0.85),
    seasonalType: parsed.seasonalType ?? "Autumn",
    summaryTitle: parsed.summaryTitle ?? `${parsed.undertone} / ${parsed.contrast}`,
    summaryDescription: parsed.summaryDescription ?? "",
    coreColors: Array.isArray(parsed.coreColors) ? parsed.coreColors : ["Rust", "Olive", "Forest Green"],
    avoidColors: Array.isArray(parsed.avoidColors) ? parsed.avoidColors : ["Cool Blue", "Lavender"],
    focusItems: Array.isArray(parsed.focusItems) ? parsed.focusItems : [],
  };
}

export function selfieResultToStyleExperience(
  result: SelfieAnalysisResult,
  plan: "free" | "plus" | "pro" = "plus",
): StyleExperience {
  return {
    undertone: result.undertone,
    contrast: result.contrast,
    confidence: result.confidence,
    plan,
    summary: {
      title: result.summaryTitle,
      description: result.summaryDescription,
    },
    focusItems: result.focusItems,
    palette: {
      core: result.coreColors,
      avoid: result.avoidColors,
    },
    recommendations: [
      {
        id: "rec-1",
        category: "Outerwear",
        title: "Warm tone blazer",
        reason: `Complements your ${result.undertone.toLowerCase()} undertone beautifully.`,
        score: 0.94,
        price: "$89",
      },
      {
        id: "rec-2",
        category: "Top",
        title: "Earth tone essential tee",
        reason: `Works perfectly with your ${result.contrast.toLowerCase()} profile.`,
        score: 0.91,
        price: "$44",
      },
      {
        id: "rec-3",
        category: "Occasion",
        title: "Deep palette dinner knit",
        reason: `Harmonizes with your ${result.seasonalType} palette for evening settings.`,
        score: 0.89,
        price: "$72",
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  Clothing Quick Check                                               */
/* ------------------------------------------------------------------ */

type ClothingAnalysisResult = {
  label: string;
  score: number;
  confidence: number;
  bestUse: string;
  reason: string;
  colorFamily: string;
  clothingCheck: ClothingCheck;
};

const CLOTHING_SYSTEM = "You are a professional color analyst. You evaluate clothing items against a user's personal color profile. Return ONLY valid JSON.";

function buildClothingPrompt(profile: {
  undertone: string;
  contrast: string;
  coreColors: string[];
  avoidColors: string[];
}): string {
  return `The user has the following color profile:
- Undertone: ${profile.undertone}
- Contrast: ${profile.contrast}
- Best colors: ${profile.coreColors.join(", ")}
- Colors to avoid: ${profile.avoidColors.join(", ")}

Analyze this clothing/garment photo and determine:
1. What colors are visible in the garment
2. Whether it matches the user's color profile
3. How well it matches (score 0.0 to 1.0)
4. Where best to use it (near face, as a layer, bottom piece)
5. Styling advice

Return ONLY valid JSON:
{
  "label": "Good Match" or "Poor Match" or "Borderline",
  "score": 0.85,
  "confidence": 0.90,
  "bestUse": "Great as a layering piece",
  "reason": "The warm terracotta tone complements your golden undertone...",
  "colorFamily": "Earth Tone",
  "clothingCheck": {
    "visible_colors": ["Terracotta", "Rust"],
    "verdict": "uyuyor",
    "explanation": "This garment's warm tones harmonize with your palette...",
    "suggestion": "Pair with deep olive bottoms for a complete autumn look."
  }
}`;
}

export async function analyzeClothing(
  imageUri: string,
  profile: { undertone: string; contrast: string; coreColors: string[]; avoidColors: string[] },
): Promise<ClothingAnalysisResult> {
  const base64 = await imageUriToBase64(imageUri);
  const mimeType = imageUri.toLowerCase().includes(".png") ? "image/png" : "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const prompt = buildClothingPrompt(profile);
  const rawJson = await callOpenRouter(CLOTHING_MODEL, CLOTHING_SYSTEM, [
    { type: "text", text: prompt },
    { type: "image_url", image_url: { url: dataUrl } },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("OpenRouter returned invalid JSON for clothing analysis.");
  }

  return {
    label: parsed.label ?? "Analyzed",
    score: parsed.score ?? 0.7,
    confidence: parsed.confidence ?? 0.8,
    bestUse: parsed.bestUse ?? "Versatile piece",
    reason: parsed.reason ?? "Analysis complete.",
    colorFamily: parsed.colorFamily ?? "Neutral",
    clothingCheck: {
      visible_colors: parsed.clothingCheck?.visible_colors ?? [],
      verdict: parsed.clothingCheck?.verdict ?? "uyuyor",
      explanation: parsed.clothingCheck?.explanation ?? "",
      suggestion: parsed.clothingCheck?.suggestion ?? "",
    },
  };
}
