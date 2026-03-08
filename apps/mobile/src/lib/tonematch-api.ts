import type { ImagePickerAsset } from "expo-image-picker";

import { mockStyleProfile, wardrobeItems as previewWardrobeItems } from "@/src/features/style/mock-data";
import { backendConfigured, supabaseConfig } from "@/src/lib/env";
import {
  analyzeClothing,
  analyzeSelfie,
  geminiConfigured,
  selfieResultToStyleExperience,
} from "@/src/lib/gemini";
import { supabase } from "@/src/lib/supabase";
import { useAppStore } from "@/src/store/app-store";
import { loadProfile, saveProfile } from "@/src/store/profile-store";
import type {
  AnalysisSessionView,
  ExportPayload,
  QuickCheckView,
  RecommendationCard,
  StyleExperience,
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

async function invokeEdgeFunction<TResponse>(functionName: string, body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const response = await fetch(`${supabaseConfig.url}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${supabaseConfig.anonKey}`,
      ...(session?.access_token ? { "x-supabase-auth": `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  const payload = (await response.json().catch(() => null)) as { error?: string } | TResponse | null;

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

async function isBackendReachable(): Promise<boolean> {
  if (_backendReachable !== null) return _backendReachable;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${supabaseConfig.url}/rest/v1/`, {
      method: "HEAD",
      signal: controller.signal,
      headers: { apikey: supabaseConfig.anonKey },
    });
    clearTimeout(timeoutId);
    _backendReachable = response.ok || response.status === 401;
    return _backendReachable;
  } catch {
    _backendReachable = false;
    return false;
  }
}

function useGeminiFallback(): boolean {
  return geminiConfigured;
}

/* ------------------------------------------------------------------ */
/*  uploadAndAnalyzeSelfie                                             */
/* ------------------------------------------------------------------ */

export async function uploadAndAnalyzeSelfie(asset: ImagePickerAsset) {
  /* Try real backend first */
  if (backendConfigured) {
    const reachable = await isBackendReachable();
    if (reachable) {
      return uploadAndAnalyzeViaBackend(asset);
    }
  }

  /* Gemini direct analysis */
  if (useGeminiFallback()) {
    const result = await analyzeSelfie(asset.uri);
    const profile = selfieResultToStyleExperience(result, "plus");
    await saveProfile(profile);

    return {
      sessionId: `gemini-${Date.now()}`,
      mode: "gemini",
    };
  }

  throw new Error("No backend or Gemini API available for analysis.");
}

async function uploadAndAnalyzeViaBackend(asset: ImagePickerAsset) {
  const createUpload = await invokeEdgeFunction<CreateUploadResponse>("create-upload", {
    fileName: asset.fileName ?? `selfie-${Date.now()}.jpg`,
    contentType: asset.mimeType ?? "image/jpeg",
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
  /* Gemini sessions are already complete */
  if (sessionId.startsWith("gemini-")) {
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
  /* Check locally stored Gemini profile first */
  const stored = await loadProfile();
  if (stored) return stored;

  /* Try real backend */
  if (backendConfigured && userId) {
    const reachable = await isBackendReachable();
    if (reachable) {
      return fetchStyleExperienceFromBackend(userId);
    }
  }

  /* Fallback to mock */
  return {
    ...mockStyleProfile,
    plan: useAppStore.getState().previewPlan,
  };
}

async function fetchStyleExperienceFromBackend(userId: string): Promise<StyleExperience> {
  const profileResponse = await supabase
    .from("style_profiles")
    .select("undertone_label, undertone_confidence, contrast_label, contrast_confidence, palette_json, avoid_colors_json, fit_explanation")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileResponse.error) throw profileResponse.error;

  const planResponse = await supabase
    .from("subscription_states")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (planResponse.error) throw planResponse.error;

  const latestSetResponse = await supabase
    .from("recommendation_sets")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestSetResponse.error) throw latestSetResponse.error;

  let recommendations: RecommendationCard[] = [];
  if (latestSetResponse.data?.id) {
    const itemResponse = await supabase
      .from("recommendation_items")
      .select("id, title, category, reason, score, price_label, merchant_url")
      .eq("recommendation_set_id", latestSetResponse.data.id)
      .order("score", { ascending: false });

    if (itemResponse.error) throw itemResponse.error;

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

  if (!profileResponse.data) {
    return {
      ...mockStyleProfile,
      plan: (planResponse.data?.plan as SubscriptionPlan) ?? useAppStore.getState().previewPlan,
    };
  }

  const paletteJson = profileResponse.data.palette_json as { core?: string[]; neutrals?: string[]; accent?: string[] } | null;
  const coreColors = paletteJson?.core ?? paletteJson?.neutrals ?? [];
  const avoidColors = Array.isArray(profileResponse.data.avoid_colors_json) ? profileResponse.data.avoid_colors_json : [];

  return {
    undertone: profileResponse.data.undertone_label,
    contrast: profileResponse.data.contrast_label,
    confidence: averageConfidence(Number(profileResponse.data.undertone_confidence ?? 0), Number(profileResponse.data.contrast_confidence ?? 0)),
    plan: planResponse.data?.plan ?? "free",
    summary: {
      title: profileResponse.data.fit_explanation ?? "Yeni stil profilin hazir.",
      description: coreColors.length > 0 ? `Core palette: ${coreColors.join(", ")}` : "Ilk analiz sonucundan sonra personal palette burada olusacak.",
    },
    focusItems: buildFocusItems(coreColors, avoidColors),
    palette: { core: coreColors, avoid: avoidColors.map(String) },
    recommendations,
  };
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

  /* Gemini direct clothing analysis */
  if (useGeminiFallback()) {
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
      id: `gemini-qc-${Date.now()}`,
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

  throw new Error("No backend or Gemini API available for quick check.");
}

async function runQuickCheckViaBackend(asset: ImagePickerAsset): Promise<QuickCheckView> {
  const createUpload = await invokeEdgeFunction<CreateUploadResponse>("create-upload", {
    fileName: asset.fileName ?? `quick-check-${Date.now()}.jpg`,
    contentType: asset.mimeType ?? "image/jpeg",
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

export async function uploadWardrobeItem(asset: ImagePickerAsset, name: string) {
  if (!backendConfigured || !(await isBackendReachable())) {
    await wait(900);
    return {
      id: `local-${Date.now()}`,
      name,
      note: "Analyzed locally with Gemini AI.",
      tags: ["wardrobe", "manual"],
      fitScore: 0.82,
      createdAt: new Date().toISOString(),
    } satisfies WardrobeItemView;
  }

  const createUpload = await invokeEdgeFunction<CreateUploadResponse>("create-upload", {
    fileName: asset.fileName ?? `wardrobe-${Date.now()}.jpg`,
    contentType: asset.mimeType ?? "image/jpeg",
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
    return stored.recommendations.map((item, index) => ({
      ...item,
      id: item.id ?? `rec-${index + 1}`,
      isPremium: index % 2 === 0,
      colorFamily: "warm earthy",
      description: `Personalized for your ${stored.undertone} profile.`,
      merchantName: "ToneMatch",
      merchantSource: "gemini-analysis",
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

  return mockStyleProfile.recommendations.map((item, index) => ({
    ...item,
    id: `rec-${item.id ?? index + 1}`,
    isPremium: index % 2 === 0,
    colorFamily: "warm earthy",
    description: "Scan your face to get personalized recommendations.",
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
