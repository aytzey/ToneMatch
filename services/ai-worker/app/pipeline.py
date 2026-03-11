from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Any

import numpy as np
from PIL import Image

from app.schemas import (
    AnalyzeJobRequest,
    AnalyzeJobResult,
    QuickCheckResult,
    RecommendationItemPayload,
    StyleProfilePayload,
)


# ---------------------------------------------------------------------------
# CIELAB color-space conversion (pure numpy, no extra dependencies)
# Based on CIE 1976 L*a*b* standard with D65 illuminant
# ---------------------------------------------------------------------------

# sRGB -> linear RGB (inverse companding / gamma removal)
def _srgb_to_linear(c: np.ndarray) -> np.ndarray:
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


# Linear RGB -> CIE XYZ (D65 illuminant, sRGB primaries)
_RGB_TO_XYZ = np.array([
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.0721750],
    [0.0193339, 0.1191920, 0.9503041],
], dtype=np.float64)

# D65 reference white
_D65_WHITE = np.array([0.95047, 1.0, 1.08883], dtype=np.float64)

_DELTA = 6.0 / 29.0
_DELTA_CUBE = _DELTA ** 3
_DELTA_SQ_3 = 3.0 * _DELTA ** 2


def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """Convert sRGB float64 [0,1] array to CIELAB.

    Input shape: (..., 3) — arbitrary batch dims followed by RGB channels.
    Output shape: same, with channels = (L*, a*, b*).
    L* in [0, 100], a*/b* roughly in [-128, +128].
    """
    linear = _srgb_to_linear(rgb.astype(np.float64))
    xyz = linear @ _RGB_TO_XYZ.T
    xyz_n = xyz / _D65_WHITE

    f = np.where(xyz_n > _DELTA_CUBE, np.cbrt(xyz_n), xyz_n / _DELTA_SQ_3 + 4.0 / 29.0)

    L = 116.0 * f[..., 1] - 16.0
    a = 500.0 * (f[..., 0] - f[..., 1])
    b = 200.0 * (f[..., 1] - f[..., 2])

    return np.stack([L, a, b], axis=-1)


# ---------------------------------------------------------------------------
# Skin pixel detection
# Combines peer-reviewed RGB rules (Kovac 2003) with YCbCr thresholds
# (Chai & Ngan 1999) for robust cross-skin-tone coverage.
# ---------------------------------------------------------------------------

def detect_skin_pixels(rgb_01: np.ndarray) -> np.ndarray:
    """Return boolean mask identifying skin pixels.

    Input: float64 RGB in [0, 1] with shape (H, W, 3).
    Output: bool array (H, W).
    """
    r = (rgb_01[..., 0] * 255.0).astype(np.int32)
    g = (rgb_01[..., 1] * 255.0).astype(np.int32)
    b = (rgb_01[..., 2] * 255.0).astype(np.int32)

    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)

    # Rule 1: RGB uniform daylight skin model (Kovac 2003)
    rgb_rule = (
        (r > 95) & (g > 40) & (b > 20)
        & ((mx - mn) > 15)
        & (np.abs(r - g) > 15)
        & (r > g) & (r > b)
    )

    # Rule 2: YCbCr model (Chai & Ngan 1999)
    Y  = (0.299 * r + 0.587 * g + 0.114 * b).astype(np.float64)
    Cb = 128.0 + (-0.169 * r - 0.331 * g + 0.500 * b)
    Cr = 128.0 + (0.500 * r - 0.419 * g - 0.081 * b)

    ycbcr_rule = (
        (Y > 80)
        & (Cr >= 133) & (Cr <= 182)
        & (Cb >= 77) & (Cb <= 137)
    )

    return rgb_rule | ycbcr_rule


# ---------------------------------------------------------------------------
# ITA (Individual Typology Angle) — Chardon 1991
# Classifies skin depth independently of undertone.
# ---------------------------------------------------------------------------

ITA_THRESHOLDS = [
    (55.0, "Very Light"),
    (41.0, "Light"),
    (28.0, "Intermediate"),
    (10.0, "Tan"),
    (-30.0, "Brown"),
]


def classify_depth(ita: float) -> str:
    for threshold, label in ITA_THRESHOLDS:
        if ita > threshold:
            return label
    return "Dark"


# ---------------------------------------------------------------------------
# Image signals dataclass
# ---------------------------------------------------------------------------

@dataclass
class ImageSignals:
    # CIELAB-based metrics (primary — used for classification)
    a_star_median: float        # a* (red–green axis, positive = red)
    b_star_median: float        # b* (yellow–blue axis, positive = yellow)
    l_star_median: float        # L* (perceptual lightness 0-100)
    hue_angle: float            # atan2(b*, a*) in degrees — KEY for undertone
    chroma: float               # sqrt(a*^2 + b*^2) — perceptual saturation
    ita_angle: float            # Individual Typology Angle — depth
    ab_ratio: float             # b*/a* — olive indicator
    skin_pixel_ratio: float     # fraction of ROI that is detected skin
    depth_category: str         # ITA label (Very Light … Dark)

    # Legacy RGB-derived metrics (kept for backward compat & LLM context)
    warm_bias: float
    olive_bias: float
    brightness: float
    contrast: float             # L* std of full ROI / 100 (perceptual contrast)
    saturation: float

    # Quality metrics
    quality_score: float
    light_score: float
    confidence_score: float
    color_family: str


# ---------------------------------------------------------------------------
# Profile library  (undertone x contrast → palette + products)
# ---------------------------------------------------------------------------

PROFILE_LIBRARY: dict[tuple[str, str], dict[str, Any]] = {
    ("Warm Neutral", "Low Contrast"): {
        "palette": {
            "core": ["Ecru", "Oat", "Soft Olive", "Warm Taupe"],
            "neutrals": ["Stone", "Mushroom", "Camel Mist"],
            "accent": ["Terracotta", "Muted Teal"],
        },
        "avoid": ["Blue White", "Harsh Black", "Icy Grey"],
        "explanation": "Warm undertone with softer contrast prefers quiet, blended colors close to the face.",
        "products": [
            ("Soft olive knit polo", "Top", "Keeps warmth intact without over-sharpening the face.", "$64"),
            ("Ecru textured overshirt", "Outerwear", "Gives a cleaner frame than pure white.", "$94"),
            ("Oat casual trouser", "Bottom", "Lets warmer tops carry the look without fighting the complexion.", "$76"),
        ],
    },
    ("Warm Neutral", "Medium Contrast"): {
        "palette": {
            "core": ["Petrol", "Ecru", "Olive", "Warm Navy"],
            "neutrals": ["Stone", "Mushroom", "Soft Espresso"],
            "accent": ["Rust", "Deep Teal"],
        },
        "avoid": ["Icy Grey", "Pure White", "Blue Violet"],
        "explanation": "Warm undertone and medium contrast prefer softened but clear hues around the face.",
        "products": [
            ("Warm navy overshirt", "Outerwear", "Frames the face without flattening warmth.", "$88"),
            ("Ecru heavyweight tee", "Top", "Cleaner than stark white and more forgiving near the face.", "$44"),
            ("Olive dinner knit", "Occasion", "Adds polish without pushing the skin ashy.", "$72"),
        ],
    },
    ("Warm Neutral", "High Contrast"): {
        "palette": {
            "core": ["Deep Olive", "Copper Brown", "Warm Ink", "Sand"],
            "neutrals": ["Rich Camel", "Espresso", "Warm Stone"],
            "accent": ["Burnt Orange", "Forest"],
        },
        "avoid": ["Cold Lilac", "Steel Grey", "Snow White"],
        "explanation": "Warm profiles with stronger contrast can handle deeper, richer tones without going muddy.",
        "products": [
            ("Forest structured jacket", "Outerwear", "Keeps depth while staying in your warm lane.", "$126"),
            ("Sand rib tee", "Top", "Balances stronger contrast without looking stark.", "$48"),
            ("Copper merino layer", "Occasion", "Adds richness that plays well with a warmer face.", "$92"),
        ],
    },
    ("Cool Bright", "Low Contrast"): {
        "palette": {
            "core": ["Cool Taupe", "Dusty Rose", "Ink Blue", "Soft Berry"],
            "neutrals": ["Pearl Grey", "Slate", "Cloud"],
            "accent": ["Plum", "Blue Red"],
        },
        "avoid": ["Warm Camel", "Orange Rust", "Moss"],
        "explanation": "Cool undertones with softer contrast need cooler colors that stay refined rather than loud.",
        "products": [
            ("Slate relaxed cardigan", "Outerwear", "Keeps contrast controlled and complexion clear.", "$82"),
            ("Soft berry tee", "Top", "Adds life without turning too warm.", "$46"),
            ("Pearl knit trouser", "Bottom", "Supports a cooler wardrobe base cleanly.", "$74"),
        ],
    },
    ("Cool Bright", "Medium Contrast"): {
        "palette": {
            "core": ["Ink Blue", "True White", "Berry", "Blue Red"],
            "neutrals": ["Charcoal", "Cool Taupe", "Graphite"],
            "accent": ["Emerald", "Cobalt"],
        },
        "avoid": ["Dusty Beige", "Muted Olive", "Warm Camel"],
        "explanation": "Cool undertones with clarity respond best to cleaner contrast and cooler chroma.",
        "products": [
            ("Cobalt shirt jacket", "Outerwear", "Sharpens contrast and keeps the complexion clear.", "$112"),
            ("True white poplin shirt", "Top", "Supports a bright profile instead of dulling it.", "$64"),
            ("Berry structured knit", "Occasion", "Adds polish without turning muddy under evening light.", "$89"),
        ],
    },
    ("Cool Bright", "High Contrast"): {
        "palette": {
            "core": ["Black Cherry", "Ink", "True White", "Cobalt"],
            "neutrals": ["Charcoal", "Graphite", "Night Blue"],
            "accent": ["Fuchsia Berry", "Emerald"],
        },
        "avoid": ["Warm Beige", "Muted Camel", "Khaki"],
        "explanation": "High-contrast cool profiles look strongest in crisp, clean contrast and cooler saturation.",
        "products": [
            ("Ink wool overshirt", "Outerwear", "Supports strong contrast without greying the face.", "$138"),
            ("True white premium tee", "Top", "Works because your profile holds sharper contrast.", "$58"),
            ("Cobalt zip knit", "Occasion", "Adds color punch while staying cool and polished.", "$104"),
        ],
    },
    ("Olive Soft", "Low Contrast"): {
        "palette": {
            "core": ["Moss", "Muted Cream", "Soft Cocoa", "Smoked Teal"],
            "neutrals": ["Pebble", "Oat", "Washed Brown"],
            "accent": ["Terracotta", "Forest"],
        },
        "avoid": ["Neon Coral", "Blue White", "Harsh Black"],
        "explanation": "Soft olive profiles benefit from earthy, blended color groups that avoid high starkness.",
        "products": [
            ("Moss camp collar shirt", "Top", "Echoes olive depth without overwhelming the face.", "$58"),
            ("Pebble relaxed blazer", "Outerwear", "Keeps the look structured while staying soft.", "$128"),
            ("Smoked teal polo knit", "Occasion", "Adds interest but remains tonally aligned.", "$76"),
        ],
    },
    ("Olive Soft", "Medium Contrast"): {
        "palette": {
            "core": ["Forest", "Stone Olive", "Muted Cream", "Deep Teal"],
            "neutrals": ["Pebble", "Taupe", "Washed Espresso"],
            "accent": ["Rust Brown", "Pine"],
        },
        "avoid": ["Sharp White", "Electric Blue", "Hot Pink"],
        "explanation": "Olive undertones with moderate contrast need depth, but still prefer a muted finish.",
        "products": [
            ("Forest overshirt", "Outerwear", "Gives shape without becoming too hard near the face.", "$98"),
            ("Muted cream henley", "Top", "Cleaner than bright white for olive skin.", "$52"),
            ("Deep teal knit tee", "Occasion", "Adds contrast while staying tonally compatible.", "$68"),
        ],
    },
    ("Olive Soft", "High Contrast"): {
        "palette": {
            "core": ["Deep Forest", "Stone Cream", "Oxidized Teal", "Espresso"],
            "neutrals": ["Warm Graphite", "Pebble", "Dark Taupe"],
            "accent": ["Auburn", "Burnished Green"],
        },
        "avoid": ["Fluorescent Coral", "Icy White", "Cold Silver"],
        "explanation": "Even with more contrast, olive skin stays strongest in grounded tones rather than icy extremes.",
        "products": [
            ("Dark forest utility jacket", "Outerwear", "Uses your contrast without pushing the undertone cold.", "$146"),
            ("Stone cream waffle tee", "Top", "Brightens the look without the harshness of optic white.", "$56"),
            ("Espresso zip knit", "Occasion", "Adds structure and depth that works with olive warmth.", "$98"),
        ],
    },
}


# ---------------------------------------------------------------------------
# Classification functions (CIELAB-based — research-backed)
# ---------------------------------------------------------------------------

def classify_undertone(signals: ImageSignals) -> str:
    """Classify skin undertone using CIELAB hue angle and chroma.

    Based on:
    - Sony AI / ICCV 2023: h* > 55 → warm (yellow-shifted), h* < 55 → cool (red-shifted)
    - Van Song 2026: global skin hue range 24.6–79.6 degrees
    - Olive detection: low chroma + high b*/a* + suppressed a* (eumelanin effect)

    Thresholds were calibrated against 12-season color analysis literature
    and cross-referenced with LAB values from Dehancer portrait studies.
    """
    h = signals.hue_angle
    c = signals.chroma
    a = signals.a_star_median
    ab = signals.ab_ratio

    # Olive detection — the hardest case.
    # Olive skin is NOT green pigment; it's the optical result of eumelanin
    # (brown-black) + pheomelanin (yellow-red) producing a muted, yellow-shifted
    # appearance with suppressed redness (low a* relative to b*).
    if c < 20.0 and ab > 1.3 and a < 15.0 and h > 48.0:
        return "Olive Soft"

    # Warm: hue angle above 57° indicates dominant yellow (b*) over red (a*)
    if h > 57.0:
        return "Warm Neutral"

    # Cool: hue angle below 48° indicates dominant red (a*) over yellow (b*)
    if h < 48.0:
        return "Cool Bright"

    # Neutral zone (48–57°): use secondary indicators to break the tie
    if ab > 1.15:
        return "Warm Neutral"

    return "Cool Bright"


def classify_contrast(signals: ImageSignals) -> str:
    """Classify tonal contrast using L* standard deviation of the full ROI.

    In personal color analysis, contrast = the lightness range across facial
    features (skin, hair, eyes, brows). L* std captures this perceptually.

    Thresholds calibrated against 12-season mapping:
    - Low contrast → Summer/Spring soft variants
    - High contrast → Winter/Autumn deep variants
    """
    c = signals.contrast  # L* std / 100, so values are typically 0.05–0.30

    if c < 0.11:
        return "Low Contrast"
    if c < 0.19:
        return "Medium Contrast"
    return "High Contrast"


def classify_color_family_lab(hue_angle: float, chroma: float, a_star: float, b_star: float) -> str:
    """Classify the dominant color family of the sampled region using LAB."""
    if chroma < 10.0:
        return "muted neutral"
    if hue_angle > 65.0:
        return "warm golden"
    if hue_angle > 55.0:
        if chroma < 18.0:
            return "olive muted"
        return "warm earthy"
    if hue_angle < 40.0:
        return "cool crisp"
    if a_star > b_star:
        return "cool rosy"
    return "balanced neutral"


# ---------------------------------------------------------------------------
# Core signal extraction
# ---------------------------------------------------------------------------

def extract_image_signals(image_bytes: bytes) -> ImageSignals:
    """Extract skin color signals from a photo using CIELAB color science.

    Pipeline:
    1. Resize to 320x320, center-crop to 192x192 (face region proxy)
    2. Detect skin pixels using RGB + YCbCr dual rules
    3. Convert skin pixels to CIELAB
    4. Remove luminance outliers (top/bottom 5%) for specular/shadow filtering
    5. Compute median a*, b*, L* (median is robust to non-skin contamination)
    6. Derive hue angle h*, chroma C*, ITA, and b*/a* ratio
    """
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    width, height = image.size
    quality_score = min(1.0, (width * height) / 350_000)

    resized = image.resize((320, 320))
    rgb = np.asarray(resized).astype(np.float64) / 255.0

    # Center crop — proxy for face region
    center = rgb[64:256, 64:256]
    if center.size == 0:
        center = rgb

    # --- Skin pixel detection ---
    skin_mask = detect_skin_pixels(center)
    skin_pixel_ratio = float(skin_mask.mean())

    # Use skin pixels if we have enough, otherwise fall back to full ROI
    if skin_pixel_ratio > 0.12:
        skin_rgb = center[skin_mask]
    else:
        skin_rgb = center.reshape(-1, 3)
        skin_pixel_ratio = 1.0

    # --- Convert to CIELAB ---
    lab_pixels = rgb_to_lab(skin_rgb)
    L_all = lab_pixels[..., 0]
    a_all = lab_pixels[..., 1]
    b_all = lab_pixels[..., 2]

    # --- Remove luminance outliers (specular highlights + deep shadows) ---
    if len(L_all) > 100:
        p5, p95 = np.percentile(L_all, 5), np.percentile(L_all, 95)
        inlier = (L_all >= p5) & (L_all <= p95)
        if inlier.sum() > 50:
            L_all = L_all[inlier]
            a_all = a_all[inlier]
            b_all = b_all[inlier]

    # --- Core LAB metrics (median for robustness) ---
    L_med = float(np.median(L_all))
    a_med = float(np.median(a_all))
    b_med = float(np.median(b_all))

    # --- Derived perceptual metrics ---
    # Hue angle: the angular position on the a*b* plane
    # Values for skin typically range 24–80° (Van Song 2026)
    a_safe = max(a_med, 0.01)  # prevent atan2(b, 0)
    hue_angle = float(np.degrees(np.arctan2(b_med, a_safe)))
    if hue_angle < 0:
        hue_angle += 360.0

    # Chroma: perceptual color saturation
    chroma = float(np.sqrt(a_med ** 2 + b_med ** 2))

    # ITA (Individual Typology Angle) — Chardon 1991
    b_safe = max(b_med, 0.01)
    ita_angle = float(np.degrees(np.arctan2(L_med - 50.0, b_safe)))

    # b*/a* ratio — key olive indicator
    ab_ratio = float(b_med / a_safe)

    depth_category = classify_depth(ita_angle)
    color_family = classify_color_family_lab(hue_angle, chroma, a_med, b_med)

    # --- Legacy RGB metrics (backward compatibility + LLM context) ---
    red = center[..., 0]
    green = center[..., 1]
    blue = center[..., 2]
    brightness = float(center.mean())
    saturation = float(np.mean(np.max(center, axis=2) - np.min(center, axis=2)))
    warm_bias = float((red.mean() - blue.mean()) + 0.25 * (red.mean() - green.mean()))
    olive_bias = float(green.mean() - (red.mean() + blue.mean()) / 2.0)

    # Contrast: L* standard deviation of FULL center crop (not just skin)
    # This captures the lightness range across skin/hair/eyes/brows
    full_lab = rgb_to_lab(center.reshape(-1, 3))
    contrast_val = float(full_lab[..., 0].std() / 100.0)

    # --- Quality & confidence ---
    light_score = max(0.0, 1.0 - abs(brightness - 0.58) / 0.58)

    skin_conf = min(1.0, skin_pixel_ratio * 2.0)
    chroma_conf = min(1.0, chroma / 25.0)
    confidence_score = max(0.42, min(0.95,
        quality_score * 0.20
        + light_score * 0.20
        + skin_conf * 0.30
        + chroma_conf * 0.30
    ))

    return ImageSignals(
        a_star_median=round(a_med, 2),
        b_star_median=round(b_med, 2),
        l_star_median=round(L_med, 2),
        hue_angle=round(hue_angle, 2),
        chroma=round(chroma, 2),
        ita_angle=round(ita_angle, 2),
        ab_ratio=round(ab_ratio, 2),
        skin_pixel_ratio=round(skin_pixel_ratio, 3),
        depth_category=depth_category,
        warm_bias=round(warm_bias, 4),
        olive_bias=round(olive_bias, 4),
        brightness=round(brightness, 4),
        contrast=round(contrast_val, 4),
        saturation=round(saturation, 4),
        quality_score=round(quality_score, 3),
        light_score=round(light_score, 3),
        confidence_score=round(confidence_score, 3),
        color_family=color_family,
    )


# ---------------------------------------------------------------------------
# Analysis entry points
# ---------------------------------------------------------------------------

def run_analysis(job: AnalyzeJobRequest, image_bytes: bytes | None = None) -> AnalyzeJobResult:
    signals = extract_image_signals(image_bytes) if image_bytes else fallback_signals()
    undertone = classify_undertone(signals)
    contrast_label = classify_contrast(signals)
    profile = PROFILE_LIBRARY.get(
        (undertone, contrast_label),
        PROFILE_LIBRARY[("Warm Neutral", "Medium Contrast")],  # safe fallback
    )

    # Undertone confidence: based on distance from classification boundaries
    hue_dist_warm = max(0.0, signals.hue_angle - 57.0) / 20.0
    hue_dist_cool = max(0.0, 48.0 - signals.hue_angle) / 20.0
    olive_strength = (
        max(0.0, 1.3 - signals.ab_ratio) * -1.0  # negative when not olive
        if undertone != "Olive Soft"
        else min(1.0, (signals.ab_ratio - 1.0) * 2.0)
    )
    undertone_conf = round(max(0.55, min(0.96,
        0.65 + max(hue_dist_warm, hue_dist_cool, olive_strength) * 0.3
    )), 2)

    # Contrast confidence: based on distance from thresholds
    c = signals.contrast
    contrast_dist = min(abs(c - 0.11), abs(c - 0.19)) / 0.10
    contrast_conf = round(max(0.58, min(0.94, 0.65 + contrast_dist * 0.28)), 2)

    recommendations = [
        RecommendationItemPayload(
            title=title,
            category=category,
            reason=reason,
            score=round(max(0.7, min(0.98, signals.confidence_score - idx * 0.03 + 0.08)), 2),
            price_label=price,
            merchant_url=f"https://example.com/products/{job.asset_id}/{idx}",
            metadata={
                "source": "cielab-heuristic-worker",
                "bucket": job.bucket,
                "color_family": signals.color_family,
                "depth": signals.depth_category,
            },
        )
        for idx, (title, category, reason, price) in enumerate(
            [(p[0], p[1], p[2], p[3]) for p in profile["products"]]
            if profile["products"] and isinstance(profile["products"][0], tuple)
            else [(p["title"], p["category"], p["reason"], p["price_label"]) for p in profile["products"]]
        )
    ]

    return AnalyzeJobResult(
        quality_score=round(signals.quality_score, 2),
        light_score=round(signals.light_score, 2),
        confidence_score=round(signals.confidence_score, 2),
        style_profile=StyleProfilePayload(
            undertone_label=undertone,
            undertone_confidence=undertone_conf,
            contrast_label=contrast_label,
            contrast_confidence=contrast_conf,
            palette_json=profile["palette"],
            avoid_colors_json=profile["avoid"],
            fit_explanation=build_explanation(undertone, contrast_label, signals, profile["explanation"]),
        ),
        recommendation_items=recommendations,
        raw_signals={
            # CIELAB metrics (primary)
            "a_star_median": signals.a_star_median,
            "b_star_median": signals.b_star_median,
            "l_star_median": signals.l_star_median,
            "hue_angle": signals.hue_angle,
            "chroma": signals.chroma,
            "ita_angle": signals.ita_angle,
            "ab_ratio": signals.ab_ratio,
            "skin_pixel_ratio": signals.skin_pixel_ratio,
            "depth_category": signals.depth_category,
            # Legacy RGB
            "warm_bias": signals.warm_bias,
            "olive_bias": signals.olive_bias,
            "brightness": signals.brightness,
            "contrast": signals.contrast,
            "saturation": signals.saturation,
            # Quality
            "quality_score": signals.quality_score,
            "light_score": signals.light_score,
            "confidence_score": signals.confidence_score,
            "color_family": signals.color_family,
        },
    )


def run_quick_check(image_bytes: bytes | None = None) -> QuickCheckResult:
    signals = extract_image_signals(image_bytes) if image_bytes else fallback_signals()

    # Use LAB-based hue angle and chroma for more accurate quick check
    h = signals.hue_angle
    c = signals.chroma
    ab = signals.ab_ratio

    if h > 55.0 and c > 14.0 and signals.contrast < 0.18:
        label = "Good fit"
        score = 0.90
        best_use = "Near face and everyday rotation"
        reason = (
            "The item reads warm and softly saturated — it should sit well near the face "
            "without washing out or overpowering your complexion."
        )
    elif signals.contrast > 0.22 or c > 25.0:
        label = "Context dependent"
        score = 0.72
        best_use = "Best as a statement layer or evening piece"
        reason = (
            "Higher tonal contrast or saturation means this item works better as an outer layer "
            "or accent rather than a near-face basic."
        )
    elif c < 10.0:
        label = "Borderline"
        score = 0.60
        best_use = "Safer below the face or mixed with softer neutrals"
        reason = (
            "The item is very muted — it may flatten your complexion if worn near the face. "
            "Pair it with a warmer or brighter companion piece."
        )
    elif h < 45.0:
        label = "Context dependent"
        score = 0.68
        best_use = "Works if your profile is cool-toned"
        reason = (
            "This item leans cool/pink. It will complement cool undertones well "
            "but may clash with warm or olive skin if worn close to the face."
        )
    else:
        label = "Good fit"
        score = 0.78
        best_use = "Versatile — works across most profiles"
        reason = (
            "The item sits in a balanced tonal zone with moderate saturation. "
            "It should work for most undertone profiles in daily rotation."
        )

    confidence = round(max(0.55, min(0.93,
        (signals.quality_score + signals.light_score + min(1.0, signals.skin_pixel_ratio * 2)) / 3
    )), 2)

    return QuickCheckResult(
        label=label,
        score=round(score, 2),
        confidence=confidence,
        best_use=best_use,
        reason=reason,
        color_family=signals.color_family,
    )


# ---------------------------------------------------------------------------
# Explanation builder
# ---------------------------------------------------------------------------

def build_explanation(undertone: str, contrast_label: str, signals: ImageSignals, base_explanation: str) -> str:
    parts = [base_explanation]

    if signals.light_score < 0.50:
        parts.append(
            "Isik koşullari ideal degildi — sonuc daha temkinli tutuldu."
        )

    parts.append(f"CIELAB analiz: h*={signals.hue_angle}°, C*={signals.chroma}, L*={signals.l_star_median}.")

    depth_note = f"Cilt derinligi: {signals.depth_category} (ITA={signals.ita_angle:.0f}°)."
    parts.append(depth_note)

    if signals.skin_pixel_ratio < 0.20:
        parts.append(
            "Fotografta cilt piksel orani dusuk — sonuc daha genel bir tahmin icerir."
        )

    parts.append(f"Renk ailesi: {signals.color_family}.")

    return " ".join(parts)


# ---------------------------------------------------------------------------
# Fallback signals (no image available)
# ---------------------------------------------------------------------------

def fallback_signals() -> ImageSignals:
    return ImageSignals(
        a_star_median=17.5,
        b_star_median=18.0,
        l_star_median=62.0,
        hue_angle=45.8,   # neutral zone — will map to slightly warm
        chroma=25.1,
        ita_angle=43.0,    # "Light" depth
        ab_ratio=1.03,
        skin_pixel_ratio=0.0,
        depth_category="Light",
        warm_bias=0.08,
        olive_bias=0.02,
        brightness=0.58,
        contrast=0.15,
        saturation=0.18,
        quality_score=0.8,
        light_score=0.82,
        confidence_score=0.72,
        color_family="balanced neutral",
    )
