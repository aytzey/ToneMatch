import { File } from "expo-file-system";

import type { ClothingCheck, StyleExperience } from "@/src/types/tonematch";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";
const MODEL = "gemini-2.0-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export const geminiConfigured = Boolean(API_KEY);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function imageUriToBase64(uri: string): Promise<string> {
  const file = new File(uri);
  return file.base64();
}

async function callGemini(prompt: string, imageUri?: string): Promise<string> {
  const parts: unknown[] = [{ text: prompt }];

  if (imageUri) {
    const base64 = await imageUriToBase64(imageUri);
    const mimeType = imageUri.toLowerCase().includes(".png")
      ? "image/png"
      : "image/jpeg";
    parts.push({
      inlineData: { mimeType, data: base64 },
    });
  }

  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const textPart = data?.candidates?.[0]?.content?.parts?.find(
    (p: { text?: string }) => p.text,
  );

  if (!textPart?.text) {
    throw new Error("Gemini returned no text response.");
  }

  return textPart.text;
}

/* ------------------------------------------------------------------ */
/*  Selfie Analysis                                                    */
/* ------------------------------------------------------------------ */

type SelfieAnalysisResult = {
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

const SELFIE_PROMPT = `You are a professional color analyst. Analyze this selfie photo to determine the person's seasonal color type.

Evaluate:
1. Skin undertone (warm, cool, or neutral — be specific, e.g. "Golden Warm", "Olive Warm", "Rose Cool")
2. Contrast level between skin, hair, and eyes (Deep, Medium, or Light)
3. Seasonal color type (e.g. Deep Autumn, Soft Summer, Bright Spring, Cool Winter, etc.)
4. Confidence in your analysis (0.0 to 1.0)
5. 5-8 specific color names that would look best on this person
6. 3-5 specific color names this person should avoid
7. A summary title and description explaining the analysis
8. 2-3 focus items with styling advice

Return ONLY valid JSON in this exact format:
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
  const rawJson = await callGemini(SELFIE_PROMPT, imageUri);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("Gemini returned invalid JSON for selfie analysis.");
  }

  return {
    undertone: parsed.undertone ?? "Warm",
    contrast: parsed.contrast ?? "Medium Contrast",
    confidence: parsed.confidence ?? 0.85,
    seasonalType: parsed.seasonalType ?? "Autumn",
    summaryTitle: parsed.summaryTitle ?? `${parsed.undertone} / ${parsed.contrast}`,
    summaryDescription: parsed.summaryDescription ?? "",
    coreColors: parsed.coreColors ?? ["Rust", "Olive", "Forest Green"],
    avoidColors: parsed.avoidColors ?? ["Cool Blue", "Lavender"],
    focusItems: parsed.focusItems ?? [],
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

function buildClothingPrompt(profile: { undertone: string; contrast: string; coreColors: string[]; avoidColors: string[] }): string {
  return `You are a professional color analyst. The user has the following color profile:
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

Return ONLY valid JSON in this exact format:
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
  const prompt = buildClothingPrompt(profile);
  const rawJson = await callGemini(prompt, imageUri);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("Gemini returned invalid JSON for clothing analysis.");
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
