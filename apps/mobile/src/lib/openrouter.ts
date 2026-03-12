/**
 * OpenRouter AI client for ToneMatch mobile (fallback when backend is unavailable).
 *
 * Routes all AI through OpenRouter:
 *   - Selfie / skin-undertone -> google/gemini-3-flash-preview
 *   - Clothing analysis       -> google/gemini-3.1-flash-lite-preview
 */

import { File } from "expo-file-system";

import type {
  ClothingCheck,
  StyleExperience,
  StyleTheoryView,
} from "@/src/types/tonematch";
import {
  buildStablePalette,
  buildTheoryExamples,
} from "@/src/lib/style-profile-normalizer";

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

async function imageUriToDataUrl(uri: string) {
  const base64 = await imageUriToBase64(uri);
  const mimeType = uri.toLowerCase().includes(".png") ? "image/png" : "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

type MessageContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userContent: MessageContent[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<string> {
  if (!API_KEY) throw new Error("OPENROUTER_API_KEY is not configured.");

  const body = JSON.stringify({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: options?.temperature ?? 0.2,
    max_tokens: options?.maxTokens ?? 2048,
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

const SELFIE_SYSTEM = "You are a professional color analyst specializing in personal color analysis (seasonal color typing). You analyze selfie photos to determine skin undertone, contrast level, and recommend personalized color palettes. Background casts and room lighting are noise. Return ONLY valid JSON.";

function buildSelfiePrompt(hasOriginalReference: boolean) {
  return `Analyze this selfie photo to determine the person's seasonal color type.

Important lighting rules:
- Base undertone and contrast on the person's face, eyes, brows, hairline, and visible lip tone.
- Ignore wall color, window glare, background shadows, and clothing reflections.
- Normalize for uneven lighting before classifying undertone.
${hasOriginalReference ? "- You will receive two images: first the original selfie, then a center-weighted crop prepared to suppress background lighting. Trust the cropped image more if lighting conflicts." : "- You will receive one center-weighted selfie crop prepared for analysis."}

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
}

export async function analyzeSelfie(
  imageUri: string,
  options?: { originalImageUri?: string },
): Promise<SelfieAnalysisResult> {
  const userContent: MessageContent[] = [
    { type: "text", text: buildSelfiePrompt(Boolean(options?.originalImageUri)) },
  ];

  if (options?.originalImageUri) {
    userContent.push({
      type: "image_url",
      image_url: { url: await imageUriToDataUrl(options.originalImageUri) },
    });
  }

  userContent.push({
    type: "image_url",
    image_url: { url: await imageUriToDataUrl(imageUri) },
  });

  const rawJson = await callOpenRouter(
    SELFIE_MODEL,
    SELFIE_SYSTEM,
    userContent,
    { temperature: 0, maxTokens: 1800 },
  );

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("OpenRouter returned invalid JSON for selfie analysis.");
  }

  const stablePalette = buildStablePalette(
    parsed.undertone ?? "Warm",
    parsed.contrast ?? "Medium Contrast",
  );

  return {
    undertone: parsed.undertone ?? "Warm",
    contrast: parsed.contrast ?? "Medium Contrast",
    confidence: Number(parsed.confidence ?? 0.85),
    seasonalType: parsed.seasonalType ?? "Autumn",
    summaryTitle: parsed.summaryTitle ?? `${parsed.undertone} / ${parsed.contrast}`,
    summaryDescription: parsed.summaryDescription ?? "",
    coreColors: stablePalette.core,
    avoidColors: stablePalette.avoid,
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
/*  Long-form Theory                                                   */
/* ------------------------------------------------------------------ */

const THEORY_MODEL = "google/gemini-3.1-flash-lite-preview";
const THEORY_SYSTEM =
  "You are ToneMatch's implementation writer. You turn the app's article-backed analysis pipeline into a grounded, readable mechanics report tied to one user result. Return ONLY valid JSON.";

function buildTheoryPrompt(profile: StyleExperience): string {
  const stable = buildStablePalette(profile.undertone, profile.contrast);
  const theoryExamples = buildTheoryExamples(profile)
    .map((item, index) => `${index + 1}. ${item.title}: ${item.copy}`)
    .join("\n");
  const recommendationLines =
    profile.recommendations.length > 0
      ? profile.recommendations
          .slice(0, 3)
          .map(
            (item, index) =>
              `${index + 1}. ${item.title} (${item.category}) — ${item.reason}`,
          )
          .join("\n")
      : "No specific product recommendations available.";

  return `Write a long-form mechanics article for a ToneMatch user based on this analysis result and the app's actual implementation.

Profile:
- Undertone: ${profile.undertone}
- Contrast: ${profile.contrast}
- Normalized implementation bucket: ${stable.undertoneLabel} x ${stable.contrastLabel}
- Confidence: ${Math.round(profile.confidence * 100)}%
- Summary title: ${profile.summary.title}
- Summary description: ${profile.summary.description}
- Best colors: ${profile.palette.core.join(", ")}
- Colors to use carefully: ${profile.palette.avoid.join(", ")}
- Focus items: ${profile.focusItems.map((item) => `${item.title}: ${item.copy}`).join(" | ") || "None"}
- Recommendations:
${recommendationLines}
- Concrete examples to anchor the article:
${theoryExamples}

Implementation facts you must preserve:
- The worker resizes the image to 320x320 and uses a 192x192 center crop as a face-region proxy.
- Skin pixels are filtered with combined RGB and YCbCr rules before classification.
- The classification signal is built in CIELAB space using L*, a*, b*, hue angle, chroma, ITA, and b*/a* ratio.
- Undertone rules:
  - Olive Soft when chroma < 20, b*/a* > 1.3, a* < 15, and hue angle > 48.
  - Warm Neutral when hue angle > 57, or when the neutral band still leans yellow by ratio.
  - Cool Bright when hue angle < 48, or when the neutral band fails to hold warm.
- Contrast rules:
  - Low Contrast when L* standard deviation is below 0.11.
  - Medium Contrast when it is 0.11 to 0.19.
  - High Contrast when it is above 0.19.
- Quality uses quality score, light score, skin pixel ratio, and chroma confidence.
- Palette resolution is deterministic from the profile library, not free-form each run.

Requirements:
- Tone: intelligent, mechanical, grounded, readable
- Perspective: second person ("you")
- Length: 700-1000 words total
- Explain the implementation pipeline and map it to the user's result
- Explicitly describe why this result lands in ${stable.undertoneLabel} x ${stable.contrastLabel}
- Explain how deterministic palette resolution produces ${profile.palette.core.join(", ")}
- Mention how lighting normalization reduces background influence, without claiming it is perfect
- Include at least 3 concrete examples taken from this exact result
- At least one example must show the undertone decision branch
- At least one example must show the contrast threshold branch
- At least one example must show the palette resolver branch
- Avoid filler, generic astrology-style language, and unsupported claims
- Do not mention AI, JSON, models, or prompt instructions

Return ONLY valid JSON in this format:
{
  "title": "editorial headline",
  "subtitle": "1-2 sentence deck",
  "intro": "opening paragraph",
  "pullQuote": "short memorable line",
  "sections": [
    { "title": "section heading", "body": "section body with 2-3 paragraphs separated by \\n\\n" },
    { "title": "section heading", "body": "section body with 2-3 paragraphs separated by \\n\\n" },
    { "title": "section heading", "body": "section body with 2-3 paragraphs separated by \\n\\n" },
    { "title": "section heading", "body": "section body with 2-3 paragraphs separated by \\n\\n" }
  ],
  "examples": [
    { "title": "example label", "copy": "concrete example tied to the user's result" },
    { "title": "example label", "copy": "concrete example tied to the user's result" },
    { "title": "example label", "copy": "concrete example tied to the user's result" }
  ],
  "closing": "closing paragraph"
}`;
}

export async function generateStyleTheory(profile: StyleExperience): Promise<StyleTheoryView> {
  const stable = buildStablePalette(profile.undertone, profile.contrast);
  const rawJson = await callOpenRouter(THEORY_MODEL, THEORY_SYSTEM, [
    { type: "text", text: buildTheoryPrompt(profile) },
  ], {
    temperature: 0.15,
    maxTokens: 2600,
  });

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("OpenRouter returned invalid JSON for style theory.");
  }

  const rawSections: unknown[] = Array.isArray(parsed.sections) ? parsed.sections : [];
  const sections = rawSections
    .filter(
      (section): section is { title?: unknown; body?: unknown } =>
        Boolean(section) && typeof section === "object",
    )
    .map((section) => ({
      title:
        typeof section.title === "string" && section.title.trim().length > 0
          ? section.title.trim()
          : "Theory",
      body:
        typeof section.body === "string" && section.body.trim().length > 0
          ? section.body.trim()
          : "",
    }))
    .filter((section) => section.body.length > 0);

  const rawExamples: unknown[] = Array.isArray(parsed.examples) ? parsed.examples : [];
  const parsedExamples = rawExamples
    .filter(
      (example): example is { title?: unknown; copy?: unknown } =>
        Boolean(example) && typeof example === "object",
    )
    .map((example) => ({
      title:
        typeof example.title === "string" && example.title.trim().length > 0
          ? example.title.trim()
          : "Example",
      copy:
        typeof example.copy === "string" && example.copy.trim().length > 0
          ? example.copy.trim()
          : "",
    }))
    .filter((example) => example.copy.length > 0);
  const examples = parsedExamples.length > 0 ? parsedExamples : buildTheoryExamples(profile);

  if (sections.length === 0) {
    throw new Error("OpenRouter returned no theory sections.");
  }

  return {
    title:
      typeof parsed.title === "string" && parsed.title.trim().length > 0
        ? parsed.title.trim()
        : `How the implementation resolved ${stable.undertoneLabel} x ${stable.contrastLabel}`,
    subtitle:
      typeof parsed.subtitle === "string" && parsed.subtitle.trim().length > 0
        ? parsed.subtitle.trim()
        : `A mechanics-first explanation of why the implementation normalizes this result into ${stable.undertoneLabel} x ${stable.contrastLabel}.`,
    intro:
      typeof parsed.intro === "string" && parsed.intro.trim().length > 0
        ? parsed.intro.trim()
        : profile.summary.description,
    pullQuote:
      typeof parsed.pullQuote === "string" && parsed.pullQuote.trim().length > 0
        ? parsed.pullQuote.trim()
        : "The implementation stays useful by classifying with fixed branches and resolving one stable palette from that branch.",
    sections,
    examples,
    closing:
      typeof parsed.closing === "string" && parsed.closing.trim().length > 0
        ? parsed.closing.trim()
        : `The important part is consistency: ${stable.undertoneLabel} x ${stable.contrastLabel} should keep resolving to the same palette family unless the measured image signal really changes.`,
    source: "ai",
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
    "verdict": "matches",
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
  ], {
    temperature: 0.1,
    maxTokens: 1400,
  });

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
      verdict: parsed.clothingCheck?.verdict ?? "matches",
      explanation: parsed.clothingCheck?.explanation ?? "",
      suggestion: parsed.clothingCheck?.suggestion ?? "",
    },
  };
}
