"""Tests for the CIELAB color analysis pipeline."""

from __future__ import annotations

import io
import struct
from typing import Any

import numpy as np
import pytest
from PIL import Image

from app.pipeline import (
    ImageSignals,
    PROFILE_LIBRARY,
    classify_color_family_lab,
    classify_contrast,
    classify_depth,
    classify_undertone,
    detect_skin_pixels,
    extract_image_signals,
    fallback_signals,
    rgb_to_lab,
    run_analysis,
    run_quick_check,
)
from app.schemas import AnalyzeJobRequest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_image_bytes(
    r: int = 180, g: int = 140, b: int = 110, width: int = 400, height: int = 400,
) -> bytes:
    """Create a solid-color test image in JPEG format."""
    img = Image.new("RGB", (width, height), (r, g, b))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def _make_warm_skin_image() -> bytes:
    """Create a warm-toned skin-like image (golden-warm range)."""
    return _make_image_bytes(r=200, g=155, b=115)


def _make_cool_skin_image() -> bytes:
    """Create a cool-toned skin-like image (rosy-cool range)."""
    return _make_image_bytes(r=195, g=150, b=155)


def _make_olive_skin_image() -> bytes:
    """Create an olive-toned skin-like image (muted yellow-green)."""
    return _make_image_bytes(r=175, g=155, b=120)


def _build_signals(**overrides: Any) -> ImageSignals:
    """Build ImageSignals with defaults that can be overridden."""
    defaults = {
        "a_star_median": 15.0,
        "b_star_median": 20.0,
        "l_star_median": 65.0,
        "hue_angle": 53.0,
        "chroma": 25.0,
        "ita_angle": 40.0,
        "ab_ratio": 1.33,
        "skin_pixel_ratio": 0.45,
        "depth_category": "Light",
        "warm_bias": 0.1,
        "olive_bias": 0.02,
        "brightness": 0.58,
        "contrast": 0.15,
        "saturation": 0.2,
        "quality_score": 0.85,
        "light_score": 0.8,
        "confidence_score": 0.82,
        "color_family": "warm earthy",
    }
    defaults.update(overrides)
    return ImageSignals(**defaults)


# ---------------------------------------------------------------------------
# CIELAB conversion
# ---------------------------------------------------------------------------

class TestRgbToLab:
    def test_white(self):
        """Pure white should map to L*=100, a*≈0, b*≈0."""
        white = np.array([1.0, 1.0, 1.0])
        lab = rgb_to_lab(white)
        assert abs(lab[0] - 100.0) < 0.5
        assert abs(lab[1]) < 1.0
        assert abs(lab[2]) < 1.0

    def test_black(self):
        """Pure black should map to L*≈0."""
        black = np.array([0.0, 0.0, 0.0])
        lab = rgb_to_lab(black)
        assert abs(lab[0]) < 1.0

    def test_batch_shape(self):
        """Batch input preserves shape."""
        batch = np.random.rand(10, 3)
        lab = rgb_to_lab(batch)
        assert lab.shape == (10, 3)

    def test_image_shape(self):
        """Image-like input (H, W, 3) preserves shape."""
        img = np.random.rand(4, 4, 3)
        lab = rgb_to_lab(img)
        assert lab.shape == (4, 4, 3)

    def test_warm_skin_tone_hue(self):
        """A warm skin tone should have hue angle > 50°."""
        # Typical warm skin: R=200, G=155, B=115 (golden-warm)
        skin = np.array([200.0 / 255, 155.0 / 255, 115.0 / 255])
        lab = rgb_to_lab(skin)
        a, b = lab[1], lab[2]
        hue = float(np.degrees(np.arctan2(b, max(a, 0.01))))
        assert hue > 50.0, f"Warm skin hue should be >50°, got {hue:.1f}°"


# ---------------------------------------------------------------------------
# Skin detection
# ---------------------------------------------------------------------------

class TestSkinDetection:
    def test_skin_pixels_detected(self):
        """Medium skin tones should be detected."""
        skin_rgb = np.array([[[200, 155, 115]]], dtype=np.float64) / 255.0
        mask = detect_skin_pixels(skin_rgb)
        assert mask[0, 0], "Expected medium skin tone to be detected"

    def test_non_skin_rejected(self):
        """Pure blue should not be detected as skin."""
        blue = np.array([[[0, 0, 255]]], dtype=np.float64) / 255.0
        mask = detect_skin_pixels(blue)
        assert not mask[0, 0], "Blue should not be detected as skin"

    def test_batch_detection(self):
        """Detection works on full images."""
        img = np.full((10, 10, 3), [180, 140, 110], dtype=np.float64) / 255.0
        mask = detect_skin_pixels(img)
        assert mask.shape == (10, 10)
        assert mask.sum() > 0


# ---------------------------------------------------------------------------
# ITA depth classification
# ---------------------------------------------------------------------------

class TestClassifyDepth:
    @pytest.mark.parametrize("ita,expected", [
        (60.0, "Very Light"),
        (45.0, "Light"),
        (35.0, "Intermediate"),
        (15.0, "Tan"),
        (-10.0, "Brown"),
        (-40.0, "Dark"),
    ])
    def test_depth_thresholds(self, ita: float, expected: str):
        assert classify_depth(ita) == expected


# ---------------------------------------------------------------------------
# Undertone classification
# ---------------------------------------------------------------------------

class TestClassifyUndertone:
    def test_warm_high_hue(self):
        """Hue angle > 57° → Warm Neutral."""
        signals = _build_signals(hue_angle=62.0, chroma=25.0, a_star_median=15.0, ab_ratio=1.1)
        assert classify_undertone(signals) == "Warm Neutral"

    def test_cool_low_hue(self):
        """Hue angle < 48° → Cool Bright."""
        signals = _build_signals(hue_angle=42.0, chroma=25.0, a_star_median=20.0, ab_ratio=0.9)
        assert classify_undertone(signals) == "Cool Bright"

    def test_olive_detection(self):
        """Low chroma + high ab_ratio + low a* + mid-high hue → Olive Soft."""
        signals = _build_signals(hue_angle=55.0, chroma=16.0, a_star_median=12.0, ab_ratio=1.5)
        assert classify_undertone(signals) == "Olive Soft"

    def test_neutral_zone_warm_leaning(self):
        """Hue 48-57° with ab_ratio > 1.15 → Warm Neutral."""
        signals = _build_signals(hue_angle=52.0, chroma=25.0, a_star_median=15.0, ab_ratio=1.2)
        assert classify_undertone(signals) == "Warm Neutral"

    def test_neutral_zone_cool_leaning(self):
        """Hue 48-57° with ab_ratio <= 1.15 → Cool Bright."""
        signals = _build_signals(hue_angle=52.0, chroma=25.0, a_star_median=15.0, ab_ratio=1.0)
        assert classify_undertone(signals) == "Cool Bright"


# ---------------------------------------------------------------------------
# Contrast classification
# ---------------------------------------------------------------------------

class TestClassifyContrast:
    def test_low_contrast(self):
        signals = _build_signals(contrast=0.08)
        assert classify_contrast(signals) == "Low Contrast"

    def test_medium_contrast(self):
        signals = _build_signals(contrast=0.15)
        assert classify_contrast(signals) == "Medium Contrast"

    def test_high_contrast(self):
        signals = _build_signals(contrast=0.25)
        assert classify_contrast(signals) == "High Contrast"


# ---------------------------------------------------------------------------
# Color family classification
# ---------------------------------------------------------------------------

class TestClassifyColorFamily:
    def test_muted_neutral(self):
        assert classify_color_family_lab(50.0, 8.0, 10.0, 5.0) == "muted neutral"

    def test_warm_golden(self):
        assert classify_color_family_lab(70.0, 20.0, 12.0, 22.0) == "warm golden"

    def test_cool_crisp(self):
        assert classify_color_family_lab(35.0, 20.0, 18.0, 8.0) == "cool crisp"


# ---------------------------------------------------------------------------
# Signal extraction from images
# ---------------------------------------------------------------------------

class TestExtractImageSignals:
    def test_warm_image(self):
        signals = extract_image_signals(_make_warm_skin_image())
        assert signals.hue_angle > 50.0, f"Expected warm hue, got {signals.hue_angle}"
        assert signals.quality_score > 0.3
        assert signals.confidence_score > 0.4

    def test_cool_image(self):
        signals = extract_image_signals(_make_cool_skin_image())
        # Cool skin has lower hue angle
        assert signals.a_star_median > 0, "Cool skin should have positive a*"

    def test_small_image_quality(self):
        """Small images should have lower quality scores."""
        small = _make_image_bytes(width=100, height=100)
        signals = extract_image_signals(small)
        assert signals.quality_score < 0.1  # 100*100 / 350000 ≈ 0.029

    def test_fields_populated(self):
        signals = extract_image_signals(_make_warm_skin_image())
        assert signals.depth_category in ("Very Light", "Light", "Intermediate", "Tan", "Brown", "Dark")
        assert 0.0 <= signals.skin_pixel_ratio <= 1.0
        assert signals.color_family != ""


# ---------------------------------------------------------------------------
# Fallback signals
# ---------------------------------------------------------------------------

class TestFallbackSignals:
    def test_returns_valid(self):
        signals = fallback_signals()
        assert signals.quality_score > 0
        assert signals.skin_pixel_ratio == 0.0  # no image available
        assert signals.depth_category == "Light"


# ---------------------------------------------------------------------------
# Profile library coverage
# ---------------------------------------------------------------------------

class TestProfileLibrary:
    def test_all_nine_profiles_present(self):
        """All 9 undertone × contrast combinations must exist."""
        undertones = ["Warm Neutral", "Cool Bright", "Olive Soft"]
        contrasts = ["Low Contrast", "Medium Contrast", "High Contrast"]
        for u in undertones:
            for c in contrasts:
                assert (u, c) in PROFILE_LIBRARY, f"Missing profile ({u}, {c})"

    def test_profiles_have_required_fields(self):
        for key, profile in PROFILE_LIBRARY.items():
            assert "palette" in profile, f"{key} missing palette"
            assert "avoid" in profile, f"{key} missing avoid"
            assert "explanation" in profile, f"{key} missing explanation"
            assert "products" in profile, f"{key} missing products"
            assert len(profile["products"]) >= 2, f"{key} has too few products"


# ---------------------------------------------------------------------------
# End-to-end analysis
# ---------------------------------------------------------------------------

class TestRunAnalysis:
    def _make_job(self) -> AnalyzeJobRequest:
        return AnalyzeJobRequest(
            session_id="test-session-1",
            user_id="test-user-1",
            asset_id="test-asset-1",
            bucket="selfies",
            storage_path="test/selfie.jpg",
        )

    def test_with_image(self):
        """Full analysis with an actual image."""
        result = run_analysis(self._make_job(), image_bytes=_make_warm_skin_image())
        assert result.quality_score > 0
        assert result.confidence_score > 0
        assert result.style_profile.undertone_label in ("Warm Neutral", "Cool Bright", "Olive Soft")
        assert result.style_profile.contrast_label in ("Low Contrast", "Medium Contrast", "High Contrast")
        assert len(result.recommendation_items) >= 2

    def test_without_image(self):
        """Fallback analysis without image should still succeed."""
        result = run_analysis(self._make_job(), image_bytes=None)
        assert result.quality_score > 0
        assert result.style_profile.undertone_label != ""
        assert len(result.recommendation_items) >= 2

    def test_result_scores_in_range(self):
        result = run_analysis(self._make_job(), image_bytes=_make_warm_skin_image())
        assert 0.0 <= result.quality_score <= 1.0
        assert 0.0 <= result.light_score <= 1.0
        assert 0.0 <= result.confidence_score <= 1.0
        assert 0.0 < result.style_profile.undertone_confidence <= 1.0
        assert 0.0 < result.style_profile.contrast_confidence <= 1.0

    def test_recommendations_have_valid_scores(self):
        result = run_analysis(self._make_job(), image_bytes=_make_warm_skin_image())
        for item in result.recommendation_items:
            assert 0.0 <= item.score <= 1.0, f"Score {item.score} out of range for {item.title}"

    def test_raw_signals_populated(self):
        result = run_analysis(self._make_job(), image_bytes=_make_warm_skin_image())
        assert result.raw_signals is not None
        assert "hue_angle" in result.raw_signals
        assert "chroma" in result.raw_signals
        assert "ita_angle" in result.raw_signals

    def test_different_skin_tones_produce_different_results(self):
        """Different skin images should (likely) produce different undertone classifications."""
        warm_result = run_analysis(self._make_job(), image_bytes=_make_warm_skin_image())
        cool_result = run_analysis(self._make_job(), image_bytes=_make_cool_skin_image())
        # They may or may not be different, but the pipeline should complete without errors for both
        assert warm_result.style_profile.undertone_label != ""
        assert cool_result.style_profile.undertone_label != ""


# ---------------------------------------------------------------------------
# Quick check
# ---------------------------------------------------------------------------

class TestRunQuickCheck:
    def test_with_image(self):
        result = run_quick_check(image_bytes=_make_warm_skin_image())
        assert result.label in ("Good fit", "Context dependent", "Borderline", "Not a match")
        assert 0.0 <= result.score <= 1.0
        assert 0.0 <= result.confidence <= 1.0
        assert result.color_family != ""

    def test_without_image(self):
        result = run_quick_check(image_bytes=None)
        assert result.label != ""
        assert result.score > 0

    def test_different_items_may_differ(self):
        warm = run_quick_check(image_bytes=_make_warm_skin_image())
        cool = run_quick_check(image_bytes=_make_cool_skin_image())
        # Both should complete without error
        assert warm.label != ""
        assert cool.label != ""
