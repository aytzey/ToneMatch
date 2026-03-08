from __future__ import annotations

import base64
import json
import logging
from io import BytesIO
from typing import Any

import httpx
from PIL import Image

from app.settings import settings

logger = logging.getLogger(__name__)

OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

# Max dimension for the image sent to the LLM (keeps token cost reasonable)
_LLM_IMAGE_MAX_DIM = 512


def _prepare_image_b64(image_bytes: bytes) -> str:
    """Resize image for LLM vision and return base64 JPEG string."""
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((_LLM_IMAGE_MAX_DIM, _LLM_IMAGE_MAX_DIM), Image.LANCZOS)
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode("ascii")

SYSTEM_PROMPT = (
    "Sen, 15 yillik deneyime sahip profesyonel bir kisisel renk ve stil danismanisin. "
    "CIELAB renk bilimi, Munsell sistemi ve 12-sezon kisisel renk analizi konularinda uzmansin. "
    "Goruntu analizinden elde edilen CIELAB olcumleri (L*, a*, b*, hue angle, chroma, ITA) ve "
    "bilimsel renk teorisine dayanarak, kullanicinin cilt alt tonu, kontrast seviyesi ve "
    "en uygun renk paletini detayli ve anlasilir bir sekilde acikliyorsun. "
    "Yanitlarini her zaman JSON formatinda ver. Turkce yaz."
)


def _build_user_prompt(
    undertone: str,
    contrast: str,
    signals: dict[str, Any],
    base_profile: dict[str, Any],
) -> str:
    palette = base_profile.get("palette", {})
    avoid = base_profile.get("avoid", [])

    core_colors = ", ".join(palette.get("core", []))
    neutral_colors = ", ".join(palette.get("neutrals", []))
    accent_colors = ", ".join(palette.get("accent", []))
    avoid_colors = ", ".join(avoid)

    # CIELAB metrics
    l_star = signals.get('l_star_median', 'N/A')
    a_star = signals.get('a_star_median', 'N/A')
    b_star = signals.get('b_star_median', 'N/A')
    hue_angle = signals.get('hue_angle', 'N/A')
    chroma = signals.get('chroma', 'N/A')
    ita_angle = signals.get('ita_angle', 'N/A')
    ab_ratio = signals.get('ab_ratio', 'N/A')
    skin_pixel_ratio = signals.get('skin_pixel_ratio', 'N/A')
    depth_category = signals.get('depth_category', 'N/A')

    return f"""Asagidaki goruntu analiz sonuclarina dayanarak kapsamli bir stil yorumu yap.

## Siniflandirma Sonuclari
- **Alt ton (undertone):** {undertone}
- **Kontrast seviyesi:** {contrast}

## CIELAB Renk Bilimi Olcumleri
Bu degerler selfie fotografindan cilt piksellerinin CIELAB renk uzayinda analiz edilmesiyle elde edilmistir.

- **L* (aydinlik):** {l_star} (0=siyah, 100=beyaz; cilt icin tipik aralik 50-75)
- **a* (kirmizi-yesil ekseni):** {a_star} (pozitif=kirmizi, negatif=yesil; cilt icin tipik 8-25)
- **b* (sari-mavi ekseni):** {b_star} (pozitif=sari, negatif=mavi; cilt icin tipik 10-30)
- **Hue angle h* (ton acisi):** {hue_angle}° (atan2(b*,a*); cilt araligi 24-80°; >57°=sicak, <48°=soguk)
- **Chroma C* (renk doygunlugu):** {chroma} (sqrt(a*²+b*²); global cilt araligi 9-30)
- **ITA (Bireysel Tipoloji Acisi):** {ita_angle}° (Chardon 1991; cilt derinlik siniflandirmasi)
- **b*/a* orani:** {ab_ratio} (>1.3 + dusuk chroma = olive gostergesi)
- **Cilt piksel orani:** {skin_pixel_ratio} (tespit edilen cilt pikseli yuzdesi)
- **Cilt derinlik kategorisi:** {depth_category}

## Ek RGB Sinyalleri
- warm_bias: {signals.get('warm_bias', 'N/A')}
- olive_bias: {signals.get('olive_bias', 'N/A')}
- brightness: {signals.get('brightness', 'N/A')}
- contrast (L* std/100): {signals.get('contrast', 'N/A')}
- saturation: {signals.get('saturation', 'N/A')}
- color_family: {signals.get('color_family', 'N/A')}
- quality_score: {signals.get('quality_score', 'N/A')}
- light_score: {signals.get('light_score', 'N/A')}
- confidence_score: {signals.get('confidence_score', 'N/A')}

## Onerilen Palet
- **Ana renkler:** {core_colors}
- **Notr renkler:** {neutral_colors}
- **Aksan renkler:** {accent_colors}

## Kacinilmasi Gereken Renkler
{avoid_colors}

Yorumunu yaparken:
1. Fotografa dikkatli bak — cilt rengini ve alt tonunu gorsel olarak degerlendir.
2. CIELAB degerlerini bilimsel olarak yorumla (ornegin hue angle 60° ise "b* baskin, sari-sicak yonelim").
3. Chroma dusukse "dusuk doygunluk, mutelak tonlar daha uyumlu" gibi yorumla.
4. ITA acisina gore cilt derinligini ve buna uygun renk yogunlugunu tart.
5. b*/a* oranina gore olive egilimini degerlendir.

Lutfen asagidaki JSON yapisinda yanit ver:

{{
  "detailed_analysis": "2-3 paragraflik detayli cilt alt tonu ve renk analizi aciklamasi. Hem gorsel gozlemi hem CIELAB degerlerini referans goster.",
  "color_science": "Bu renklerin neden teknik olarak iyi calistigi hakkinda bilimsel aciklama. Hue angle, chroma ve ITA degerlerini kullanarak acikla.",
  "daily_combinations": [
    {{
      "outfit": "Kombin aciklamasi",
      "occasion": "Hangi ortam icin uygun",
      "why": "Neden bu kombin iyi calisir"
    }}
  ],
  "seasonal_advice": "Mevsimsel renk gecis onerileri (12-sezon sistemine referans vererek)",
  "avoid_explained": "Kacinilmasi gereken renklerin neden kacinilmasi gerektigi detayli aciklama (CIELAB perspektifinden)",
  "pro_tips": ["Profesyonel ipucu 1", "Profesyonel ipucu 2", "Profesyonel ipucu 3"],
  "confidence_note": "Analiz guvenilirligi hakkinda not (cilt piksel orani, isik kalitesi ve chroma degerini referans goster)"
}}

daily_combinations dizisinde 3-4 farkli kombin onerisi olsun.
pro_tips dizisinde 3-5 adet pratik ipucu olsun.
Tum alanlar Turkce olmali."""


async def interpret_analysis(
    undertone: str,
    contrast: str,
    signals: dict[str, Any],
    base_profile: dict[str, Any],
    image_bytes: bytes | None = None,
) -> dict[str, Any] | None:
    """Call OpenRouter LLM for a rich skin-tone style interpretation.

    When *image_bytes* is provided the selfie is included in the request
    so the vision model can visually assess skin undertone alongside the
    CIELAB signals.

    Returns parsed JSON dict on success, None on any failure.
    Never raises -- all errors are caught and logged so the heuristic
    pipeline can still return a valid result.
    """
    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY is not set -- skipping LLM interpretation.")
        return None

    user_prompt = _build_user_prompt(undertone, contrast, signals, base_profile)

    # Build multimodal user message when we have the photo
    if image_bytes:
        try:
            image_b64 = _prepare_image_b64(image_bytes)
            user_content: list[dict[str, Any]] = [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                },
                {"type": "text", "text": user_prompt},
            ]
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to encode image for LLM, falling back to text-only: %s", exc)
            user_content = user_prompt  # type: ignore[assignment]
    else:
        user_content = user_prompt  # type: ignore[assignment]

    request_body = {
        "model": settings.llm_model,
        "temperature": 0.7,
        "max_tokens": 3000,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
    }

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://tonematch.app",
        "X-Title": "ToneMatch AI Worker",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.llm_timeout) as client:
            response = await client.post(
                OPENROUTER_CHAT_URL,
                headers=headers,
                json=request_body,
            )

        if response.status_code != 200:
            logger.error(
                "OpenRouter returned status %d: %s",
                response.status_code,
                response.text[:500],
            )
            return None

        data = response.json()
        content = data["choices"][0]["message"]["content"]

        parsed: dict[str, Any] = json.loads(content)
        return parsed

    except httpx.TimeoutException:
        logger.error("OpenRouter request timed out after %.1fs", settings.llm_timeout)
        return None
    except (httpx.HTTPError, httpx.StreamError) as exc:
        logger.error("HTTP error during OpenRouter call: %s", exc)
        return None
    except (json.JSONDecodeError, KeyError, IndexError) as exc:
        logger.error("Failed to parse OpenRouter response: %s", exc)
        return None
    except Exception as exc:  # noqa: BLE001
        logger.error("Unexpected error in LLM interpretation: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Clothing fit check  (separate Gemini call — clothing photo, NOT selfie)
# ---------------------------------------------------------------------------

CLOTHING_SYSTEM_PROMPT = (
    "Sen, kisisel renk analizi ve stil danismanligi konusunda uzman bir AI asistanisin. "
    "Kullanicinin cilt alt tonu ve kontrast profili sana verilecek. "
    "Fotograftaki KIYAFETI inceleyerek bu kisiye uygun olup olmadigini degerlendir. "
    "Yanitlarini her zaman JSON formatinda ver. Turkce yaz."
)


def _build_clothing_prompt(
    undertone: str,
    contrast: str,
    palette_json: dict[str, Any],
    avoid_colors: list[str],
) -> str:
    core = ", ".join(palette_json.get("core", []))
    neutrals = ", ".join(palette_json.get("neutrals", []))
    accents = ", ".join(palette_json.get("accent", []))
    avoid = ", ".join(avoid_colors)

    return f"""Fotograftaki KIYAFETI incele ve asagidaki kullanici profiline gore uyum analizi yap.

## Kullanici Profili
- **Alt ton:** {undertone}
- **Kontrast:** {contrast}
- **Uygun ana renkler:** {core}
- **Uygun notr renkler:** {neutrals}
- **Uygun aksan renkler:** {accents}
- **Kacinilmasi gereken renkler:** {avoid}

## Gorev
1. Fotograftaki kiyafetin rengini/renklerini tespit et.
2. Bu renklerin kullanicinin cilt alt tonuyla uyumunu degerlendir.
3. Kiyafet ust giyim mi (yuz yakininda etki buyuk) yoksa alt giyim mi (etki daha az) bunu belirt.
4. Net bir karar ver: "uyuyor", "uymuyor" veya "kismen uyuyor".

Lutfen asagidaki JSON yapisinda yanit ver:

{{
  "visible_colors": ["Kiyafette gorunen renk 1", "Kiyafette gorunen renk 2"],
  "garment_type": "Kiyafet turu (ornegin: tisort, gomlek, ceket, pantolon vb.)",
  "position": "ust giyim / alt giyim / dis giyim / aksesuar",
  "verdict": "uyuyor / uymuyor / kismen uyuyor",
  "explanation": "Detayli aciklama — bu kiyafetin rengi neden bu kisiye uyuyor/uymuyor, cilt alt tonu ve kontrast acisidan",
  "suggestion": "Eger uyumlu degilse alternatif renk onerisi; uyumluysa tamamlayici parca onerisi",
  "score": 0.0
}}

score alani 0.0 - 1.0 arasinda uyum puani olsun (1.0 = mukemmel uyum).
Tum alanlar Turkce olmali (garment_type ve position dahil)."""


async def check_clothing_fit(
    undertone: str,
    contrast: str,
    palette_json: dict[str, Any],
    avoid_colors: list[str],
    image_bytes: bytes,
) -> dict[str, Any] | None:
    """Send a clothing photo to the vision LLM and evaluate fit against user profile.

    Returns parsed JSON dict on success, None on any failure.
    Never raises.
    """
    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY is not set -- skipping clothing check.")
        return None

    try:
        image_b64 = _prepare_image_b64(image_bytes)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to encode clothing image for LLM: %s", exc)
        return None

    user_prompt = _build_clothing_prompt(undertone, contrast, palette_json, avoid_colors)

    user_content: list[dict[str, Any]] = [
        {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
        },
        {"type": "text", "text": user_prompt},
    ]

    request_body = {
        "model": settings.llm_model,
        "temperature": 0.5,
        "max_tokens": 1200,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": CLOTHING_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
    }

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://tonematch.app",
        "X-Title": "ToneMatch AI Worker",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.llm_timeout) as client:
            response = await client.post(
                OPENROUTER_CHAT_URL,
                headers=headers,
                json=request_body,
            )

        if response.status_code != 200:
            logger.error(
                "OpenRouter clothing check returned status %d: %s",
                response.status_code,
                response.text[:500],
            )
            return None

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        parsed: dict[str, Any] = json.loads(content)
        return parsed

    except httpx.TimeoutException:
        logger.error("Clothing check timed out after %.1fs", settings.llm_timeout)
        return None
    except (httpx.HTTPError, httpx.StreamError) as exc:
        logger.error("HTTP error during clothing check: %s", exc)
        return None
    except (json.JSONDecodeError, KeyError, IndexError) as exc:
        logger.error("Failed to parse clothing check response: %s", exc)
        return None
    except Exception as exc:  # noqa: BLE001
        logger.error("Unexpected error in clothing check: %s", exc)
        return None
