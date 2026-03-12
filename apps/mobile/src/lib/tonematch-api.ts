import type { ImagePickerAsset } from "expo-image-picker";

import { compressForAnalysis, compressForWardrobe } from "@/src/lib/image-compress";
import { mockStyleProfile, wardrobeItems as previewWardrobeItems } from "@/src/features/style/mock-data";
import { backendConfigured, supabaseConfig } from "@/src/lib/env";
import {
  analyzeClothing,
  analyzeSelfie,
  generateStyleTheory as generateOpenRouterStyleTheory,
  openrouterConfigured,
  selfieResultToStyleExperience,
} from "@/src/lib/openrouter";
import {
  applyStablePalette,
  buildStablePalette,
  buildTheoryExamples,
} from "@/src/lib/style-profile-normalizer";
import { supabase } from "@/src/lib/supabase";
import { useAppStore } from "@/src/store/app-store";
import { loadProfile, saveProfile } from "@/src/store/profile-store";
import type {
  AnalysisSnapshot,
  AnalysisSessionView,
  ExportPayload,
  QuickCheckView,
  RecommendationCard,
  StyleExperience,
  StyleTheoryView,
  SubscriptionPlan,
  SubscriptionStateView,
  WardrobeItemView,
} from "@/src/types/tonematch";

/* ------------------------------------------------------------------ */
/*  Supabase types                                                     */
/* ------------------------------------------------------------------ */

type CreateUploadResponse = {
  asset: { id: string; bucket: string; storage_path: string; status: string };
  upload: { path: string; token: string; signedUrl: string };
};

type FinalizeAnalysisResponse = {
  session: { id: string; status: string; created_at: string };
  workerDispatch: { accepted: boolean; mode: string };
};

type FinalizeWardrobeResponse = {
  wardrobeItem: { id: string; name: string; note: string; color_tags: string[]; fit_score: number; created_at: string };
};

type QuickCheckResponse = {
  quickCheck: {
    id: string; label: string; score: number; confidence: number; best_use: string;
    reason: string; color_family: string; created_at: string;
    metadata?: { clothing_check?: { visible_colors: string[]; garment_type: string; position: string; verdict: string; explanation: string; suggestion: string; score: number } } | null;
  };
};

type PrepareMerchantClickResponse = {
  click: { id: string; click_state: string; target_url: string; resolved_url: string; created_at: string };
};

type ReportMerchantClickResponse = {
  click: { id: string; click_state: string; clicked_at: string | null; last_attempted_at: string | null; failure_reason: string | null };
};

/* ------------------------------------------------------------------ */
/*  Backend helpers                                                    */
/* ------------------------------------------------------------------ */

async function invokeEdgeFunction<TResponse>(functionName: string, body?: unknown, timeoutMs = 60_000) {
  const { data: { session } } = await supabase.auth.getSession();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const authToken = session?.access_token ?? supabaseConfig.anonKey;
  console.log(`[invokeEdgeFunction] ${functionName} | hasSession: ${!!session} | authToken: ${authToken?.slice(0, 20)}...`);

  const response = await fetch(`${supabaseConfig.url}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body ?? {}),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  const payload = (await response.json().catch(() => null)) as { error?: string } | TResponse | null;
  console.log(`[invokeEdgeFunction] ${functionName} | status: ${response.status} | payload:`, JSON.stringify(payload)?.slice(0, 200));

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Edge function ${functionName} failed with status ${response.status}.`;
    return { data: null, error: new Error(message) };
  }

  return { data: payload as TResponse, error: null };
}

let _backendReachable: boolean | null = null;
let _backendReachableCheckedAt = 0;
const REACHABLE_CACHE_TTL_MS = 30_000; // re-check every 30 seconds
const isWebRuntime = typeof window !== "undefined" && typeof document !== "undefined";

function isLocalWebOrigin() {
  if (!isWebRuntime) {
    return false;
  }

  const hostname = globalThis.location?.hostname ?? "";
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local") ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

async function isBackendReachable(): Promise<boolean> {
  const now = Date.now();
  if (_backendReachable !== null && now - _backendReachableCheckedAt < REACHABLE_CACHE_TTL_MS) {
    console.log("[isBackendReachable] cached:", _backendReachable);
    return _backendReachable;
  }

  if (isLocalWebOrigin()) {
    _backendReachable = false;
    _backendReachableCheckedAt = now;
    console.log("[isBackendReachable] skipping local web probe to avoid CORS preflight failures");
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${supabaseConfig.url}/functions/v1/create-upload`, {
      method: "OPTIONS",
      signal: controller.signal,
      headers: { apikey: supabaseConfig.anonKey },
    });
    clearTimeout(timeoutId);
    _backendReachable = response.ok;
    _backendReachableCheckedAt = now;
    console.log("[isBackendReachable] fresh check:", response.status, "→", _backendReachable);
    return _backendReachable;
  } catch (err) {
    _backendReachable = false;
    _backendReachableCheckedAt = now;
    console.error("[isBackendReachable] network error:", err);
    return false;
  }
}

function shouldUseOpenRouterFallback(): boolean {
  return openrouterConfigured;
}

function joinNatural(values: string[]) {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function buildAnalysisSnapshot(
  profile: StyleExperience,
  options?: { capturedAt?: string; sourceSessionId?: string | null },
): AnalysisSnapshot {
  const normalized = applyStablePalette(profile);

  return {
    undertone: normalized.undertone,
    contrast: normalized.contrast,
    confidence: normalized.confidence,
    summary: {
      title: normalized.summary.title,
      description: normalized.summary.description,
    },
    focusItems: normalized.focusItems.map((item) => ({
      title: item.title,
      copy: item.copy,
    })),
    palette: {
      core: [...normalized.palette.core],
      avoid: [...normalized.palette.avoid],
    },
    recommendations: normalized.recommendations.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      reason: item.reason,
      score: Number(item.score ?? 0),
      price: item.price,
      merchantUrl: item.merchantUrl ?? null,
      merchantName: item.merchantName ?? null,
      merchantSource: item.merchantSource ?? null,
      isPremium: item.isPremium,
      colorFamily: item.colorFamily,
    })),
    capturedAt: options?.capturedAt ?? new Date().toISOString(),
    sourceSessionId: options?.sourceSessionId ?? null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function parseFocusItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      return {
        title: typeof item.title === "string" ? item.title : "",
        copy: typeof item.copy === "string" ? item.copy : "",
      };
    })
    .filter((item): item is { title: string; copy: string } => Boolean(item?.title || item?.copy));
}

function parseRecommendations(value: unknown): RecommendationCard[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const recommendations: RecommendationCard[] = [];

  value.forEach((item, index) => {
    if (!isRecord(item)) {
      return;
    }

    recommendations.push({
      id: typeof item.id === "string" ? item.id : `snapshot-rec-${index + 1}`,
      title:
        typeof item.title === "string" ? item.title : "Recommended piece",
      category:
        typeof item.category === "string" ? item.category : "Style pick",
      description:
        typeof item.description === "string" ? item.description : undefined,
      reason: typeof item.reason === "string" ? item.reason : "",
      score: Number(item.score ?? 0),
      price: typeof item.price === "string" ? item.price : "",
      merchantUrl:
        typeof item.merchantUrl === "string" ? item.merchantUrl : null,
      merchantName:
        typeof item.merchantName === "string" ? item.merchantName : null,
      merchantSource:
        typeof item.merchantSource === "string" ? item.merchantSource : null,
      isPremium:
        typeof item.isPremium === "boolean" ? item.isPremium : undefined,
      colorFamily:
        typeof item.colorFamily === "string" ? item.colorFamily : undefined,
    });
  });

  return recommendations;
}

function normalizeSubscriptionPlan(
  plan: string | null | undefined,
): SubscriptionPlan {
  return plan === "free" || plan === "plus" || plan === "pro"
    ? plan
    : useAppStore.getState().previewPlan;
}

function parseAnalysisSnapshot(value: unknown): AnalysisSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  const summary = isRecord(value.summary)
    ? {
        title: typeof value.summary.title === "string" ? value.summary.title : "",
        description: typeof value.summary.description === "string" ? value.summary.description : "",
      }
    : { title: "", description: "" };

  const paletteValue = isRecord(value.palette) ? value.palette : {};
  const snapshot: AnalysisSnapshot = {
    undertone: typeof value.undertone === "string" ? value.undertone : "",
    contrast: typeof value.contrast === "string" ? value.contrast : "",
    confidence: Number(value.confidence ?? 0),
    summary,
    focusItems: parseFocusItems(value.focusItems),
    palette: {
      core: parseStringArray(paletteValue.core),
      avoid: parseStringArray(paletteValue.avoid),
    },
    recommendations: parseRecommendations(value.recommendations),
    capturedAt: typeof value.capturedAt === "string" ? value.capturedAt : undefined,
    sourceSessionId:
      typeof value.sourceSessionId === "string" ? value.sourceSessionId : null,
  };

  if (!snapshot.undertone || !snapshot.contrast) {
    return null;
  }

  return snapshot;
}

function styleExperienceFromSnapshot(
  snapshot: AnalysisSnapshot,
  plan: SubscriptionPlan,
): StyleExperience {
  return applyStablePalette({
    undertone: snapshot.undertone,
    contrast: snapshot.contrast,
    confidence: snapshot.confidence,
    plan,
    summary: snapshot.summary,
    focusItems: snapshot.focusItems,
    palette: snapshot.palette,
    recommendations: snapshot.recommendations,
  });
}

async function persistLocalAnalysisSnapshot(profile: StyleExperience) {
  if (!backendConfigured) {
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return;
  }

  const snapshot = buildAnalysisSnapshot(profile);
  const normalized = applyStablePalette(profile);
  const upsertProfile = await supabase
    .from("style_profiles")
    .upsert({
      user_id: userId,
      undertone_label: normalized.undertone,
      undertone_confidence: normalized.confidence,
      contrast_label: normalized.contrast,
      contrast_confidence: normalized.confidence,
      palette_json: {
        core: normalized.palette.core,
        neutrals: [],
        accent: [],
      },
      avoid_colors_json: normalized.palette.avoid,
      fit_explanation: normalized.summary.description,
      analysis_snapshot_json: snapshot,
      source_analysis_session_id: null,
    }, {
      onConflict: "user_id",
    });

  if (upsertProfile.error) {
    throw upsertProfile.error;
  }

  if (normalized.recommendations.length === 0) {
    return;
  }

  const recommendationSet = await supabase
    .from("recommendation_sets")
    .insert({
      user_id: userId,
      analysis_session_id: null,
      context: "home",
      metadata: {
        source: "openrouter-direct",
        analysis_snapshot: snapshot,
      },
    })
    .select("id")
    .single();

  if (recommendationSet.error) {
    throw recommendationSet.error;
  }

  const itemsInsert = await supabase
    .from("recommendation_items")
    .insert(
      normalized.recommendations.map((item) => ({
        recommendation_set_id: recommendationSet.data.id,
        title: item.title,
        category: item.category,
        reason: item.reason,
        score: item.score,
        price_label: item.price,
        merchant_url: item.merchantUrl ?? null,
        metadata: {
          source: "openrouter-direct",
          undertone: normalized.undertone,
          contrast: normalized.contrast,
          paletteCore: normalized.palette.core.slice(0, 4),
        },
      })),
    );

  if (itemsInsert.error) {
    throw itemsInsert.error;
  }
}

function buildFallbackTheory(profile: StyleExperience): StyleTheoryView {
  const normalizedProfile = applyStablePalette(profile);
  const stable = buildStablePalette(
    normalizedProfile.undertone,
    normalizedProfile.contrast,
  );
  const bestColors = normalizedProfile.palette.core.slice(0, 4);
  const cautionColors = normalizedProfile.palette.avoid.slice(0, 3);
  const topRecommendation = normalizedProfile.recommendations[0];
  const examples = buildTheoryExamples(normalizedProfile);
  const undertoneMechanic =
    stable.undertoneLabel === "Olive Soft"
      ? "The worker's olive branch only opens when chroma stays muted, b*/a* rises above 1.3, a* stays suppressed, and the normalized hue angle remains above 48 degrees."
      : stable.undertoneLabel === "Warm Neutral"
        ? "The worker resolves Warm Neutral when the normalized hue angle clears 57 degrees, or when a near-neutral hue still shows enough yellow dominance in the b*/a* ratio to stay on the warm side."
        : "The worker resolves Cool Bright when hue angle falls below 48 degrees, or when the neutral zone does not show enough yellow dominance to hold a warm classification.";
  const contrastMechanic =
    stable.contrastLabel === "Low Contrast"
      ? "Low Contrast is assigned when the L* standard deviation of the center facial crop stays below 0.11."
      : stable.contrastLabel === "Medium Contrast"
        ? "Medium Contrast is assigned when facial L* spread sits between 0.11 and 0.19."
        : "High Contrast is assigned once facial L* spread crosses 0.19.";

  return {
    title: `How the implementation resolved ${stable.undertoneLabel} x ${stable.contrastLabel}`,
    subtitle:
      "A mechanics-first breakdown of the article-backed pipeline, the thresholds it uses, and why your result lands in this exact bucket.",
    intro: `This screen is no longer generic style theory. It is the implementation note for the analysis pipeline itself. ToneMatch first normalizes the selfie, center-crops the face region, filters for likely skin pixels, converts those pixels into CIELAB space, then classifies undertone and contrast with fixed thresholds. Your current result maps into the ${stable.undertoneLabel} x ${stable.contrastLabel} branch, and that branch resolves the palette deterministically instead of asking the model to invent a fresh color story each time. ${normalizedProfile.summary.description}`,
    pullQuote: `The article implementation is simple on purpose: normalize the face region, classify with fixed CIELAB thresholds, then resolve one stable palette for that bucket.`,
    sections: [
      {
        title: "Step 1: what the article implementation actually measures",
        body: `The worker implementation described in the article does not start by asking an LLM for a vibe-based opinion. It resizes the image to 320 by 320, center-crops a 192 by 192 face proxy, applies dual skin-pixel detection rules in RGB and YCbCr space, and only then converts the sampled pixels into CIELAB. That is the mechanical core of the system.\n\nThe key signals are L*, a*, b*, hue angle, chroma, ITA, b*/a* ratio, skin pixel ratio, brightness, saturation, and a contrast measure derived from the L* spread of the full center crop. Those are the signals the article implementation trusts before it maps anything into undertone, contrast, recommendations, or palette.`,
      },
      {
        title: "Step 2: why your result lands in this undertone branch",
        body: `${undertoneMechanic} Because your current result is being normalized into ${stable.undertoneLabel}, the implementation is effectively saying that the normalized facial color signal belongs in that branch, not in the competing branches.\n\nThis matters because the article implementation is threshold-driven. It does not let every rerun freestyle a new undertone family. Once the signal family points toward ${stable.undertoneLabel}, the downstream palette logic stays attached to that same undertone bucket. That is the consistency layer you asked for.`,
      },
      {
        title: "Step 3: how contrast is assigned",
        body: `${contrastMechanic} That threshold comes from the lightness spread across skin, hair, brows, and eyes inside the normalized crop. In other words, the implementation is not reading contrast as a stylistic adjective; it is reading it as a measurable light-dark range.\n\nYour current branch resolves to ${stable.contrastLabel}, so the system is choosing a palette density that matches that band. This is why the same undertone bucket can still produce different advice for low, medium, and high contrast users: the article implementation splits the wardrobe logic on contrast after undertone is fixed.`,
      },
      {
        title: "Step 4: how the deterministic palette is resolved",
        body: `After classification, the implementation does not ask for random color invention. It looks up the profile library entry for ${stable.undertoneLabel} x ${stable.contrastLabel} and resolves the core palette from there. In your case that means ${joinNatural(bestColors)} lead the recommendation set, while ${joinNatural(cautionColors)} stay in the caution group.\n\n${topRecommendation ? `${topRecommendation.title} is a downstream example of this logic. ${topRecommendation.reason}` : "The recommendation layer is downstream of the bucket, not upstream of it."} The point is that your result is anchored to one profile library entry, so the same signal family returns the same color family instead of drifting from run to run.`,
      },
      {
        title: "Step 5: where lighting normalization helps and where it can still fail",
        body: `The article explicitly treats lighting as a stabilization problem, not a magic correction problem. The implementation reduces background influence by center-cropping the image and basing the decision on detected skin pixels rather than the whole frame. On the worker side, it also drops luminance outliers from the top and bottom five percent so highlights and deep shadows do less damage.\n\nThis means background light should matter less than before, but not literally disappear. If the room casts a strong color onto the face, or if the face itself is under uneven light, the result can still move. That is why the pipeline also carries quality, light, and confidence signals instead of pretending every selfie is equally reliable.`,
      },
    ],
    examples,
    closing:
      `The implementation takeaway is straightforward: the selfie is normalized, the face region is measured in CIELAB, undertone and contrast are classified with fixed branches, and the palette is resolved from one stable library entry. That is why ${stable.undertoneLabel} x ${stable.contrastLabel} should keep returning the same color family unless the underlying image signal genuinely changes.`,
    source: "fallback",
  };
}

export async function generateStyleTheory(profile: StyleExperience): Promise<StyleTheoryView> {
  const normalizedProfile = applyStablePalette(profile);

  if (!shouldUseOpenRouterFallback()) {
    return buildFallbackTheory(normalizedProfile);
  }

  try {
    return await generateOpenRouterStyleTheory(normalizedProfile);
  } catch (error) {
    console.error("[generateStyleTheory] falling back after AI error:", error);
    return buildFallbackTheory(normalizedProfile);
  }
}

/* ------------------------------------------------------------------ */
/*  uploadAndAnalyzeSelfie                                             */
/* ------------------------------------------------------------------ */

export async function uploadAndAnalyzeSelfie(asset: ImagePickerAsset) {
  console.log("[uploadAndAnalyzeSelfie] backendConfigured:", backendConfigured, "openrouterConfigured:", openrouterConfigured);

  /* Try real backend first */
  if (backendConfigured) {
    const reachable = await isBackendReachable();
    console.log("[uploadAndAnalyzeSelfie] reachable:", reachable);
    if (reachable) {
      console.log("[uploadAndAnalyzeSelfie] → backend path");
      return uploadAndAnalyzeViaBackend(asset);
    }
  }

  /* OpenRouter direct analysis */
  if (shouldUseOpenRouterFallback()) {
    console.log("[uploadAndAnalyzeSelfie] → openrouter path");
    const normalizedAsset = await compressForAnalysis(asset);
    const result = await analyzeSelfie(normalizedAsset.uri, { originalImageUri: asset.uri });
    const profile = applyStablePalette(selfieResultToStyleExperience(result, "plus"));
    await saveProfile(profile);
    try {
      await persistLocalAnalysisSnapshot(profile);
    } catch (error) {
      console.error("[uploadAndAnalyzeSelfie] could not persist local analysis snapshot:", error);
    }

    return {
      sessionId: `openrouter-${Date.now()}`,
      mode: "openrouter",
    };
  }

  throw new Error("No backend or OpenRouter API available for analysis.");
}

async function uploadAndAnalyzeViaBackend(rawAsset: ImagePickerAsset) {
  const asset = await compressForAnalysis(rawAsset);

  const createUpload = await invokeEdgeFunction<CreateUploadResponse>("create-upload", {
    fileName: rawAsset.fileName ?? `selfie-${Date.now()}.jpg`,
    contentType: "image/jpeg",
    kind: "selfie",
  });

  if (createUpload.error || !createUpload.data) {
    throw createUpload.error ?? new Error("Could not create signed upload.");
  }

  const fileBody = await fileAssetToBlob(asset);
  const uploadResult = await supabase.storage
    .from(createUpload.data.asset.bucket)
    .uploadToSignedUrl(createUpload.data.upload.path, createUpload.data.upload.token, fileBody, {
      contentType: asset.mimeType ?? "image/jpeg",
    });

  if (uploadResult.error) throw uploadResult.error;

  const finalize = await invokeEdgeFunction<FinalizeAnalysisResponse>("finalize-analysis", {
    assetId: createUpload.data.asset.id,
  });

  if (finalize.error || !finalize.data) {
    throw finalize.error ?? new Error("Could not create analysis session.");
  }

  return {
    sessionId: finalize.data.session.id,
    mode: finalize.data.workerDispatch.mode,
  };
}

/* ------------------------------------------------------------------ */
/*  pollAnalysisSession                                                */
/* ------------------------------------------------------------------ */

export async function pollAnalysisSession(sessionId: string, timeoutMs = 45_000) {
  /* OpenRouter sessions are already complete */
  if (sessionId.startsWith("openrouter-")) {
    return {
      id: sessionId,
      status: "completed",
      createdAt: new Date().toISOString(),
      confidenceScore: 0.92,
    } satisfies AnalysisSessionView;
  }

  if (!backendConfigured) {
    await wait(1400);
    return {
      id: sessionId,
      status: "completed",
      createdAt: new Date().toISOString(),
      confidenceScore: 0.86,
    } satisfies AnalysisSessionView;
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from("analysis_sessions")
      .select("id, status, confidence_score, created_at")
      .eq("id", sessionId)
      .single();

    if (error) throw error;

    if (data.status === "completed" || data.status === "failed") {
      return {
        id: data.id,
        status: data.status,
        confidenceScore: data.confidence_score,
        createdAt: data.created_at,
      } satisfies AnalysisSessionView;
    }

    await wait(2200);
  }

  throw new Error("Analysis timed out before completion.");
}

/* ------------------------------------------------------------------ */
/*  fetchStyleExperience                                               */
/* ------------------------------------------------------------------ */

export async function fetchStyleExperience(userId?: string | null): Promise<StyleExperience | null> {
  console.log("[fetchStyleExperience] userId:", userId, "backendConfigured:", backendConfigured);

  /* Check locally stored profile first */
  const stored = await loadProfile();
  console.log("[fetchStyleExperience] stored profile:", stored ? "found" : "null");
  if (stored) return applyStablePalette(stored);

  /* Try real backend */
  if (backendConfigured && userId) {
    const reachable = await isBackendReachable();
    console.log("[fetchStyleExperience] reachable:", reachable);
    if (reachable) {
      console.log("[fetchStyleExperience] → backend path");
      return fetchStyleExperienceFromBackend(userId);
    }
  }

  console.log("[fetchStyleExperience] → mock fallback");
  /* Fallback to mock */
  return applyStablePalette({
    ...mockStyleProfile,
    plan: normalizeSubscriptionPlan(useAppStore.getState().previewPlan),
  });
}

async function fetchStyleExperienceFromBackend(userId: string): Promise<StyleExperience> {
  console.log("[fetchStyleExperienceFromBackend] userId:", userId);

  const profileResponse = await supabase
    .from("style_profiles")
    .select("undertone_label, undertone_confidence, contrast_label, contrast_confidence, palette_json, avoid_colors_json, fit_explanation, analysis_snapshot_json")
    .eq("user_id", userId)
    .maybeSingle();

  console.log("[fetchStyleExperienceFromBackend] style_profiles:", profileResponse.error ? "ERROR: " + profileResponse.error.message : profileResponse.data ? "found" : "null");
  if (profileResponse.error) throw profileResponse.error;

  const planResponse = await supabase
    .from("subscription_states")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  console.log("[fetchStyleExperienceFromBackend] subscription_states:", planResponse.error ? "ERROR: " + planResponse.error.message : planResponse.data?.plan ?? "null");
  if (planResponse.error) throw planResponse.error;

  const latestSetResponse = await supabase
    .from("recommendation_sets")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log("[fetchStyleExperienceFromBackend] recommendation_sets:", latestSetResponse.error ? "ERROR: " + latestSetResponse.error.message : latestSetResponse.data?.id ?? "null");
  if (latestSetResponse.error) throw latestSetResponse.error;

  let recommendations: RecommendationCard[] = [];
  const snapshot = parseAnalysisSnapshot(profileResponse.data?.analysis_snapshot_json);

  if (snapshot?.recommendations.length) {
    recommendations = snapshot.recommendations;
  }

  if (latestSetResponse.data?.id) {
    const itemResponse = await supabase
      .from("recommendation_items")
      .select("id, title, category, reason, score, price_label, merchant_url")
      .eq("recommendation_set_id", latestSetResponse.data.id)
      .order("score", { ascending: false });

    if (itemResponse.error) throw itemResponse.error;

    if (recommendations.length === 0) {
      recommendations = (itemResponse.data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        reason: item.reason ?? "",
        score: Number(item.score ?? 0),
        price: item.price_label ?? "",
        merchantUrl: item.merchant_url,
      }));
    }
  }

  if (!profileResponse.data) {
    return applyStablePalette({
      ...mockStyleProfile,
      plan: normalizeSubscriptionPlan(
        planResponse.data?.plan ?? useAppStore.getState().previewPlan,
      ),
    });
  }
  const stablePalette = buildStablePalette(
    profileResponse.data.undertone_label,
    profileResponse.data.contrast_label,
  );

  if (snapshot) {
    return styleExperienceFromSnapshot({
      ...snapshot,
      recommendations: recommendations.length > 0 ? recommendations : snapshot.recommendations,
    }, normalizeSubscriptionPlan(
      planResponse.data?.plan ?? useAppStore.getState().previewPlan,
    ));
  }

  return applyStablePalette({
    undertone: profileResponse.data.undertone_label,
    contrast: profileResponse.data.contrast_label,
    confidence: averageConfidence(Number(profileResponse.data.undertone_confidence ?? 0), Number(profileResponse.data.contrast_confidence ?? 0)),
    plan: normalizeSubscriptionPlan(planResponse.data?.plan ?? "free"),
    summary: {
      title: `${profileResponse.data.undertone_label} / ${profileResponse.data.contrast_label}`,
      description: profileResponse.data.fit_explanation ?? "Yeni stil profilin hazir.",
    },
    focusItems: buildFocusItems(stablePalette.core, stablePalette.avoid),
    palette: { core: stablePalette.core, avoid: stablePalette.avoid },
    recommendations,
  });
}

/* ------------------------------------------------------------------ */
/*  runQuickCheck                                                      */
/* ------------------------------------------------------------------ */

export async function runQuickCheck(asset: ImagePickerAsset): Promise<QuickCheckView> {
  /* Try real backend first */
  if (backendConfigured) {
    const reachable = await isBackendReachable();
    if (reachable) {
      return runQuickCheckViaBackend(asset);
    }
  }

  /* OpenRouter direct clothing analysis */
  if (shouldUseOpenRouterFallback()) {
    const stored = await loadProfile();
    const profile = stored
      ? {
          undertone: stored.undertone,
          contrast: stored.contrast,
          coreColors: stored.palette.core,
          avoidColors: stored.palette.avoid,
        }
      : {
          undertone: "Warm",
          contrast: "Medium Contrast",
          coreColors: ["Rust", "Olive", "Forest Green"],
          avoidColors: ["Cool Blue", "Lavender"],
        };

    const result = await analyzeClothing(asset.uri, profile);

    return {
      id: `openrouter-qc-${Date.now()}`,
      label: result.label,
      score: result.score,
      confidence: result.confidence,
      bestUse: result.bestUse,
      reason: result.reason,
      colorFamily: result.colorFamily,
      createdAt: new Date().toISOString(),
      clothingCheck: result.clothingCheck,
    };
  }

  throw new Error("No backend or OpenRouter API available for quick check.");
}

async function runQuickCheckViaBackend(rawAsset: ImagePickerAsset): Promise<QuickCheckView> {
  const asset = await compressForWardrobe(rawAsset);

  const createUpload = await invokeEdgeFunction<CreateUploadResponse>("create-upload", {
    fileName: rawAsset.fileName ?? `quick-check-${Date.now()}.jpg`,
    contentType: "image/jpeg",
    kind: "wardrobe",
  });

  if (createUpload.error || !createUpload.data) {
    throw createUpload.error ?? new Error("Could not create quick check upload.");
  }

  const fileBody = await fileAssetToBlob(asset);
  const uploadResult = await supabase.storage
    .from(createUpload.data.asset.bucket)
    .uploadToSignedUrl(createUpload.data.upload.path, createUpload.data.upload.token, fileBody, {
      contentType: asset.mimeType ?? "image/jpeg",
    });

  if (uploadResult.error) throw uploadResult.error;

  const response = await invokeEdgeFunction<QuickCheckResponse>("quick-check", {
    assetId: createUpload.data.asset.id,
  });

  if (response.error || !response.data) {
    throw response.error ?? new Error("Could not complete quick check.");
  }

  const cc = response.data.quickCheck.metadata?.clothing_check ?? null;

  return {
    id: response.data.quickCheck.id,
    label: response.data.quickCheck.label,
    score: response.data.quickCheck.score,
    confidence: response.data.quickCheck.confidence,
    bestUse: response.data.quickCheck.best_use,
    reason: response.data.quickCheck.reason,
    colorFamily: response.data.quickCheck.color_family,
    createdAt: response.data.quickCheck.created_at,
    clothingCheck: cc,
  };
}

/* ------------------------------------------------------------------ */
/*  fetchAnalysisHistory                                               */
/* ------------------------------------------------------------------ */

export async function fetchAnalysisHistory(userId?: string | null): Promise<AnalysisSessionView[]> {
  if (!backendConfigured || !userId) return [];

  const reachable = await isBackendReachable();
  if (!reachable) return [];

  const { data, error } = await supabase
    .from("analysis_sessions")
    .select("id, status, confidence_score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw error;

  return (data ?? []).map((item) => ({
    id: item.id,
    status: item.status,
    confidenceScore: item.confidence_score,
    createdAt: item.created_at,
  }));
}

/* ------------------------------------------------------------------ */
/*  deleteAccountData                                                  */
/* ------------------------------------------------------------------ */

export async function deleteAccountData() {
  const { clearProfile } = await import("@/src/store/profile-store");
  await clearProfile();

  const reachable = await isBackendReachable();
  if (backendConfigured && reachable) {
    const { error } = await invokeEdgeFunction("privacy-delete-account");
    if (error) throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  Wardrobe                                                           */
/* ------------------------------------------------------------------ */

export async function uploadWardrobeItem(rawAsset: ImagePickerAsset, name: string) {
  if (!backendConfigured || !(await isBackendReachable())) {
    await wait(900);
    return {
      id: `local-${Date.now()}`,
      name,
      note: "Analyzed locally via OpenRouter AI.",
      tags: ["wardrobe", "manual"],
      fitScore: 0.82,
      createdAt: new Date().toISOString(),
    } satisfies WardrobeItemView;
  }

  const asset = await compressForWardrobe(rawAsset);

  const createUpload = await invokeEdgeFunction<CreateUploadResponse>("create-upload", {
    fileName: rawAsset.fileName ?? `wardrobe-${Date.now()}.jpg`,
    contentType: "image/jpeg",
    kind: "wardrobe",
  });

  if (createUpload.error || !createUpload.data) {
    throw createUpload.error ?? new Error("Could not create wardrobe upload.");
  }

  const fileBody = await fileAssetToBlob(asset);
  const uploadResult = await supabase.storage
    .from(createUpload.data.asset.bucket)
    .uploadToSignedUrl(createUpload.data.upload.path, createUpload.data.upload.token, fileBody, {
      contentType: asset.mimeType ?? "image/jpeg",
    });

  if (uploadResult.error) throw uploadResult.error;

  const finalized = await invokeEdgeFunction<FinalizeWardrobeResponse>("finalize-wardrobe-item", {
    assetId: createUpload.data.asset.id,
    name,
  });

  if (finalized.error || !finalized.data) {
    throw finalized.error ?? new Error("Could not finalize wardrobe item.");
  }

  return {
    id: finalized.data.wardrobeItem.id,
    name: finalized.data.wardrobeItem.name,
    note: finalized.data.wardrobeItem.note,
    tags: finalized.data.wardrobeItem.color_tags,
    fitScore: finalized.data.wardrobeItem.fit_score,
    createdAt: finalized.data.wardrobeItem.created_at,
  } satisfies WardrobeItemView;
}

export async function fetchWardrobeItems(userId?: string | null): Promise<WardrobeItemView[]> {
  if (!backendConfigured || !userId || !(await isBackendReachable())) {
    return previewWardrobeItems.map((item) => ({
      id: item.id,
      name: item.name,
      note: item.note,
      tags: item.tags,
      fitScore: item.fitScore,
      createdAt: new Date().toISOString(),
    }));
  }

  const { data, error } = await supabase
    .from("wardrobe_items")
    .select("id, name, note, color_tags, fit_score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    note: item.note ?? "",
    tags: item.color_tags ?? [],
    fitScore: item.fit_score,
    createdAt: item.created_at,
  }));
}

/* ------------------------------------------------------------------ */
/*  Feedback / Commerce                                                */
/* ------------------------------------------------------------------ */

export async function submitRecommendationFeedback(userId: string | undefined, recommendationItemId: string, signal: string) {
  if (!backendConfigured || !userId || recommendationItemId.startsWith("preview-") || recommendationItemId.startsWith("rec-") || !(await isBackendReachable())) {
    await wait(250);
    return { ok: true, mode: "local" };
  }

  const feedbackPayload = recommendationItemId.startsWith("catalog-")
    ? { user_id: userId, catalog_item_id: recommendationItemId.replace("catalog-", ""), signal, details: { source: "mobile-discover-catalog" } }
    : { user_id: userId, recommendation_item_id: recommendationItemId, signal, details: { source: "mobile-discover" } };

  const { error } = await supabase.from("feedback_events").insert(feedbackPayload);
  if (error) throw error;
  return { ok: true, mode: "persisted" };
}

export async function prepareMerchantClick(userId: string | undefined, item: RecommendationCard, options: { currentPlan: SubscriptionStateView["plan"]; rank: number; sourceContext?: string }) {
  if (!item.merchantUrl) throw new Error("Merchant URL is missing.");

  if (!backendConfigured || !userId || item.id.startsWith("preview-") || item.id.startsWith("rec-") || !(await isBackendReachable())) {
    await wait(200);
    return { clickId: `local-click-${Date.now()}`, resolvedUrl: item.merchantUrl, mode: "local" } as const;
  }

  const response = await invokeEdgeFunction<PrepareMerchantClickResponse>("prepare-merchant-click", {
    catalogItemId: normalizeCatalogItemId(item.id),
    sourceContext: options.sourceContext ?? "discover",
    merchantUrl: item.merchantUrl,
    merchantName: item.merchantName,
    sourceFeed: item.merchantSource,
    productTitle: item.title,
    currentPlan: options.currentPlan,
    rank: options.rank,
    fitScore: item.score,
    isPremium: Boolean(item.isPremium),
  });

  if (response.error || !response.data) throw response.error ?? new Error("Could not prepare merchant click.");

  return { clickId: response.data.click.id, resolvedUrl: response.data.click.resolved_url, mode: "tracked" } as const;
}

export async function reportMerchantClickOutcome(userId: string | undefined, clickId: string, clickState: "opened" | "blocked" | "failed", failureReason?: string) {
  if (!backendConfigured || !userId || clickId.startsWith("local-click-") || !(await isBackendReachable())) {
    await wait(120);
    return { ok: true, mode: "local" } as const;
  }

  const response = await invokeEdgeFunction<ReportMerchantClickResponse>("report-merchant-click", { clickId, clickState, failureReason });
  if (response.error || !response.data) throw response.error ?? new Error("Could not update merchant click.");
  return { ok: true, mode: "tracked", click: response.data.click } as const;
}

/* ------------------------------------------------------------------ */
/*  Export / Subscription                                              */
/* ------------------------------------------------------------------ */

export async function exportAccountData(): Promise<ExportPayload> {
  const stored = await loadProfile();

  if (!backendConfigured || !(await isBackendReachable())) {
    return {
      exportedAt: new Date().toISOString(),
      user: {},
      styleProfile: stored ?? mockStyleProfile,
      analysisSessions: [],
      wardrobeItems: previewWardrobeItems,
      feedbackEvents: [],
      commerceClickEvents: [],
      quickCheckResults: [],
      subscriptionState: { plan: "plus", provider: "local", periodEndsAt: null },
      revenuecatEvents: [],
    };
  }

  const response = await invokeEdgeFunction<ExportPayload>("export-account-data");
  if (response.error || !response.data) throw response.error ?? new Error("Could not export account data.");
  return response.data;
}

export async function fetchCatalogFeed(userId?: string | null): Promise<RecommendationCard[]> {
  /* Use stored profile recommendations if available */
  const stored = await loadProfile();
  if (stored && stored.recommendations.length > 0) {
    const normalized = applyStablePalette(stored);
    const colorFamily = normalized.palette.core.slice(0, 2).join(" / ");

    return normalized.recommendations.map((item, index) => ({
      ...item,
      id: item.id ?? `rec-${index + 1}`,
      isPremium: index % 2 === 0,
      colorFamily,
      description: `Built for your ${normalized.undertone} x ${normalized.contrast} result using ${normalized.palette.core.slice(0, 3).join(", ")}.`,
      merchantName: "ToneMatch",
      merchantSource: "openrouter-analysis",
    }));
  }

  if (backendConfigured && userId && (await isBackendReachable())) {
    const { data, error } = await supabase.rpc("match_catalog_items", {
      target_user_id: userId,
      desired_context: "discover",
      feed_limit: 12,
    });

    if (error) throw error;

    return (data ?? []).map((item: {
      id: string; title: string; category: string; description: string | null;
      merchant_name: string | null; source_feed: string | null; price_label: string | null;
      merchant_url: string | null; fit_score: number; reason: string; is_premium: boolean; color_family: string;
    }) => ({
      id: `catalog-${item.id}`,
      title: item.title,
      category: item.category,
      description: item.description ?? "",
      merchantName: item.merchant_name,
      merchantSource: item.source_feed,
      reason: item.reason,
      score: Number(item.fit_score ?? 0),
      price: item.price_label ?? "",
      merchantUrl: item.merchant_url,
      isPremium: item.is_premium,
      colorFamily: item.color_family,
    }));
  }

  const previewProfile = applyStablePalette({
    ...mockStyleProfile,
    plan: normalizeSubscriptionPlan(mockStyleProfile.plan),
  });

  return previewProfile.recommendations.map((item, index) => ({
    ...item,
    id: `rec-${item.id ?? index + 1}`,
    isPremium: index % 2 === 0,
    colorFamily: previewProfile.palette.core.slice(0, 2).join(" / "),
    description: `Preview feed tuned to ${previewProfile.undertone} x ${previewProfile.contrast}. Scan your face to replace it with your latest analysis.`,
    merchantName: "ToneMatch",
    merchantSource: "default",
  }));
}

export async function fetchSubscriptionState(userId?: string | null): Promise<SubscriptionStateView> {
  if (!backendConfigured || !userId || !(await isBackendReachable())) {
    return { plan: "plus", provider: "local", periodEndsAt: null };
  }

  const { data, error } = await supabase
    .from("subscription_states")
    .select("plan, provider, period_ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return {
    plan: data?.plan ?? "free",
    provider: data?.provider ?? "revenuecat",
    periodEndsAt: data?.period_ends_at ?? null,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function fileAssetToBlob(asset: ImagePickerAsset) {
  const response = await fetch(asset.uri);
  return response.blob();
}

function normalizeCatalogItemId(itemId: string) {
  return itemId.startsWith("catalog-") ? itemId.replace("catalog-", "") : null;
}

function averageConfidence(undertone: number, contrast: number) {
  if (!undertone && !contrast) return 0;
  return Number(((undertone + contrast) / 2).toFixed(2));
}

function buildFocusItems(core: string[], avoid: string[]) {
  return [
    {
      title: "Near-face colors",
      copy: core.length > 0
        ? `${core.slice(0, 3).join(", ")} yuz cevresinde ilk denenecek grup.`
        : "Ilk analizden sonra yuz cevresi icin guvenli tonlar burada gorunecek.",
    },
    {
      title: "Use with caution",
      copy: avoid.length > 0
        ? `${avoid.slice(0, 3).join(", ")} sert isikta seni soldurabilir.`
        : "Daha zayif tonlar analiz sonucu ile beraber listelenecek.",
    },
  ];
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
