from urllib.parse import quote

from fastapi import FastAPI, Header, HTTPException
import httpx

from app.llm_service import check_clothing_fit, interpret_analysis
from app.pipeline import run_analysis, run_quick_check, PROFILE_LIBRARY
from app.schemas import AnalyzeJobRequest, QuickCheckRequest
from app.settings import settings

app = FastAPI(title="ToneMatch AI Worker", version="0.3.0")


@app.get("/healthz")
async def healthz():
    return {"ok": True, "service": "tone-match-ai-worker"}


@app.post("/jobs/analyze")
async def analyze_job(payload: AnalyzeJobRequest, x_shared_secret: str = Header(default="")):
    ensure_secret(x_shared_secret)

    image_bytes = None
    if settings.supabase_url and settings.supabase_service_role_key:
        image_bytes = await download_storage_object(payload.bucket, payload.storage_path)

    result = run_analysis(payload, image_bytes=image_bytes)

    # --- LLM interpretation ---
    profile_key = (result.style_profile.undertone_label, result.style_profile.contrast_label)
    base_profile = PROFILE_LIBRARY.get(profile_key, {})

    llm_result = await interpret_analysis(
        undertone=result.style_profile.undertone_label,
        contrast=result.style_profile.contrast_label,
        signals=result.raw_signals or {},
        base_profile=base_profile,
        image_bytes=image_bytes,
    )

    if llm_result:
        result.style_profile.fit_explanation = llm_result.get(
            "detailed_analysis", result.style_profile.fit_explanation
        )
        result.llm_interpretation = llm_result
    # --- end LLM interpretation ---

    if not settings.supabase_url or not settings.supabase_service_role_key:
        return {"ok": True, "mode": "dry-run", "result": result.model_dump()}

    headers = build_rest_headers()

    async with httpx.AsyncClient(timeout=settings.storage_request_timeout) as client:
        session_update = await client.patch(
            f"{settings.supabase_url}/rest/v1/analysis_sessions?id=eq.{payload.session_id}",
            headers=headers,
            json={
                "status": "processing",
                "quality_score": result.quality_score,
                "light_score": result.light_score,
                "confidence_score": result.confidence_score,
            },
        )
        session_update.raise_for_status()

        profile_upsert = await client.post(
            f"{settings.supabase_url}/rest/v1/style_profiles",
            headers={**headers, "Prefer": "resolution=merge-duplicates"},
            json={
                "user_id": payload.user_id,
                "undertone_label": result.style_profile.undertone_label,
                "undertone_confidence": result.style_profile.undertone_confidence,
                "contrast_label": result.style_profile.contrast_label,
                "contrast_confidence": result.style_profile.contrast_confidence,
                "palette_json": result.style_profile.palette_json,
                "avoid_colors_json": result.style_profile.avoid_colors_json,
                "fit_explanation": result.style_profile.fit_explanation,
                "source_analysis_session_id": payload.session_id,
            },
        )
        profile_upsert.raise_for_status()

        recommendation_set_payload = {
            "user_id": payload.user_id,
            "analysis_session_id": payload.session_id,
            "context": "home",
        }
        if result.llm_interpretation:
            recommendation_set_payload["metadata"] = {
                "llm_model": settings.llm_model,
                "color_science": result.llm_interpretation.get("color_science"),
                "seasonal_advice": result.llm_interpretation.get("seasonal_advice"),
                "daily_combinations": result.llm_interpretation.get("daily_combinations"),
                "avoid_explained": result.llm_interpretation.get("avoid_explained"),
                "pro_tips": result.llm_interpretation.get("pro_tips"),
                "confidence_note": result.llm_interpretation.get("confidence_note"),
            }

        recommendation_set = await client.post(
            f"{settings.supabase_url}/rest/v1/recommendation_sets",
            headers=headers,
            json=recommendation_set_payload,
        )
        recommendation_set.raise_for_status()
        recommendation_set_id = recommendation_set.json()[0]["id"]

        recommendation_items = [
            {
                "recommendation_set_id": recommendation_set_id,
                "title": item.title,
                "category": item.category,
                "reason": item.reason,
                "score": item.score,
                "price_label": item.price_label,
                "merchant_url": item.merchant_url,
                "metadata": item.metadata,
            }
            for item in result.recommendation_items
        ]

        items_insert = await client.post(
            f"{settings.supabase_url}/rest/v1/recommendation_items",
            headers=headers,
            json=recommendation_items,
        )
        items_insert.raise_for_status()

        session_complete = await client.patch(
            f"{settings.supabase_url}/rest/v1/analysis_sessions?id=eq.{payload.session_id}",
            headers=headers,
            json={"status": "completed"},
        )
        session_complete.raise_for_status()

    return {"ok": True, "mode": "persisted", "session_id": payload.session_id}


@app.post("/jobs/quick-check")
async def quick_check(payload: QuickCheckRequest, x_shared_secret: str = Header(default="")):
    ensure_secret(x_shared_secret)

    image_bytes = None
    if settings.supabase_url and settings.supabase_service_role_key:
        image_bytes = await download_storage_object(payload.bucket, payload.storage_path)

    result = run_quick_check(image_bytes=image_bytes)

    # --- LLM clothing fit check (needs user profile + clothing photo) ---
    if image_bytes and payload.undertone_label and payload.palette_json:
        clothing_result = await check_clothing_fit(
            undertone=payload.undertone_label,
            contrast=payload.contrast_label,
            palette_json=payload.palette_json,
            avoid_colors=payload.avoid_colors_json,
            image_bytes=image_bytes,
        )
        if clothing_result:
            result.clothing_check = clothing_result
            # Override heuristic score/label with LLM verdict when available
            llm_score = clothing_result.get("score")
            if isinstance(llm_score, (int, float)) and 0 <= llm_score <= 1:
                result.score = round(llm_score, 2)
            verdict = clothing_result.get("verdict", "")
            if "uyuyor" in verdict and "uymuyor" not in verdict:
                result.label = "Good fit"
            elif "uymuyor" in verdict:
                result.label = "Not a match"
            elif "kismen" in verdict:
                result.label = "Context dependent"
    # --- end LLM clothing check ---

    return {"ok": True, "result": result.model_dump()}


def ensure_secret(secret: str):
    if secret != settings.ai_worker_shared_secret:
        raise HTTPException(status_code=401, detail="Invalid shared secret")


def build_rest_headers():
    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def download_storage_object(bucket: str, storage_path: str) -> bytes | None:
    encoded_path = quote(storage_path, safe="/")
    url = f"{settings.supabase_url}/storage/v1/object/authenticated/{bucket}/{encoded_path}"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }

    async with httpx.AsyncClient(timeout=settings.storage_request_timeout) as client:
        response = await client.get(url, headers=headers)
        if response.status_code >= 400:
            return None
        return response.content
