import { createClient } from "jsr:@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type CatalogIngestItem = {
  externalId?: string;
  slug?: string;
  title: string;
  category: string;
  description?: string;
  merchantUrl?: string;
  imageUrl?: string;
  priceLabel?: string;
  priceAmount?: number;
  currencyCode?: string;
  toneLabels?: string[];
  contrastLabels?: string[];
  colorFamilyTags?: string[];
  occasionTags?: string[];
  genderTargets?: string[];
  isPremium?: boolean;
  active?: boolean;
  inventoryStatus?: string;
  merchantName?: string;
  metadata?: Record<string, unknown>;
};

type IngestCatalogBody = {
  sourceFeed: string;
  items: CatalogIngestItem[];
  deactivateMissing?: boolean;
  mode?: string;
  requestMeta?: Record<string, unknown>;
};

function normalizeArray(values: string[] | undefined, fallback: string[] = []) {
  return Array.from(new Set((values ?? fallback).map((value) => value.trim()).filter(Boolean)));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeInventoryStatus(value?: string) {
  const normalized = (value ?? "in_stock").toLowerCase();
  if (normalized === "low_stock") {
    return "low_stock";
  }
  if (normalized === "out_of_stock" || normalized === "sold_out") {
    return "out_of_stock";
  }
  if (normalized === "discontinued") {
    return "discontinued";
  }
  return "in_stock";
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function formatPriceLabel(priceAmount?: number, currencyCode?: string, priceLabel?: string) {
  if (priceLabel?.trim()) {
    return priceLabel.trim();
  }

  if (typeof priceAmount !== "number" || Number.isNaN(priceAmount)) {
    return null;
  }

  const currency = currencyCode?.trim().toUpperCase() || "USD";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(priceAmount);
  } catch {
    return `${priceAmount.toFixed(2)} ${currency}`;
  }
}

function readSecret(headers: Headers) {
  return (
    headers.get("x-ingest-secret") ??
    headers.get("authorization")?.replace("Bearer ", "") ??
    ""
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ingestSecret = Deno.env.get("CATALOG_INGEST_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !ingestSecret) {
    return new Response(JSON.stringify({ error: "Missing catalog ingest environment variables" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (readSecret(request.headers) !== ingestSecret) {
    return new Response(JSON.stringify({ error: "Invalid ingest secret" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = (await request.json()) as IngestCatalogBody;
  const sourceFeed = body.sourceFeed?.trim();

  if (!sourceFeed) {
    return new Response(JSON.stringify({ error: "sourceFeed is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return new Response(JSON.stringify({ error: "items must be a non-empty array" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const runInsert = await adminClient
    .from("catalog_sync_runs")
    .insert({
      source_feed: sourceFeed,
      mode: body.mode ?? "manual",
      status: "running",
      received_count: body.items.length,
      request_meta: body.requestMeta ?? {},
    })
    .select("id")
    .single();

  if (runInsert.error || !runInsert.data) {
    return new Response(JSON.stringify({ error: runInsert.error?.message ?? "Could not create sync run" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const runId = runInsert.data.id as string;

  try {
    const normalizedItems = await Promise.all(
      body.items.map(async (item, index) => {
        const externalId = item.externalId?.trim() || item.slug?.trim() || `${sourceFeed}-${index + 1}`;
        const slug =
          item.slug?.trim() ||
          slugify(`${sourceFeed}-${externalId}-${item.title}`);
        const currencyCode = item.currencyCode?.trim().toUpperCase() || "USD";
        const normalized = {
          external_id: externalId,
          slug,
          title: item.title.trim(),
          category: item.category.trim(),
          description: item.description?.trim() || null,
          merchant_name: item.merchantName?.trim() || sourceFeed,
          source_feed: sourceFeed,
          merchant_url: item.merchantUrl?.trim() || "https://example.com/catalog/pending-link",
          image_url: item.imageUrl?.trim() || null,
          price_label: formatPriceLabel(item.priceAmount, currencyCode, item.priceLabel),
          price_amount:
            typeof item.priceAmount === "number" && Number.isFinite(item.priceAmount)
              ? Number(item.priceAmount.toFixed(2))
              : null,
          currency_code: currencyCode,
          tone_labels: normalizeArray(item.toneLabels),
          contrast_labels: normalizeArray(item.contrastLabels),
          color_family_tags: normalizeArray(item.colorFamilyTags),
          occasion_tags: normalizeArray(item.occasionTags, ["discover"]),
          gender_targets: normalizeArray(item.genderTargets, ["unisex"]),
          is_premium: Boolean(item.isPremium),
          active: item.active ?? true,
          inventory_status: normalizeInventoryStatus(item.inventoryStatus),
          metadata: item.metadata ?? {},
          last_seen_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
          source_hash: await sha256Hex(
            JSON.stringify({
              title: item.title,
              category: item.category,
              description: item.description,
              merchantUrl: item.merchantUrl,
              priceLabel: item.priceLabel,
              priceAmount: item.priceAmount,
              currencyCode,
              toneLabels: item.toneLabels,
              contrastLabels: item.contrastLabels,
              colorFamilyTags: item.colorFamilyTags,
              occasionTags: item.occasionTags,
              genderTargets: item.genderTargets,
              isPremium: item.isPremium,
              active: item.active,
              inventoryStatus: item.inventoryStatus,
              merchantName: item.merchantName,
              metadata: item.metadata,
            }),
          ),
        };

        return normalized;
      }),
    );

    const upsertResult = await adminClient
      .from("catalog_items")
      .upsert(normalizedItems, { onConflict: "source_feed,external_id" })
      .select("id, external_id");

    if (upsertResult.error) {
      throw upsertResult.error;
    }

    let deactivatedCount = 0;
    if (body.deactivateMissing) {
      const existingItems = await adminClient
        .from("catalog_items")
        .select("id, external_id")
        .eq("source_feed", sourceFeed)
        .neq("active", false);

      if (existingItems.error) {
        throw existingItems.error;
      }

      const seenExternalIds = new Set(normalizedItems.map((item) => item.external_id));
      const idsToDeactivate = (existingItems.data ?? [])
        .filter((item) => !seenExternalIds.has(item.external_id))
        .map((item) => item.id);

      deactivatedCount = idsToDeactivate.length;

      if (idsToDeactivate.length > 0) {
        const deactivateResult = await adminClient
          .from("catalog_items")
          .update({
            active: false,
            inventory_status: "out_of_stock",
            last_synced_at: new Date().toISOString(),
          })
          .in("id", idsToDeactivate);

        if (deactivateResult.error) {
          throw deactivateResult.error;
        }
      }
    }

    const runUpdate = await adminClient
      .from("catalog_sync_runs")
      .update({
        status: "completed",
        upserted_count: normalizedItems.length,
        deactivated_count: deactivatedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    if (runUpdate.error) {
      throw runUpdate.error;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        runId,
        sourceFeed,
        receivedCount: body.items.length,
        upsertedCount: normalizedItems.length,
        deactivatedCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    await adminClient
      .from("catalog_sync_runs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown ingest error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Catalog ingest failed", runId }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
