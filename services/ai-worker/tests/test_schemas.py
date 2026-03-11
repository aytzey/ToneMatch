"""Tests for Pydantic schemas."""

import pytest
from pydantic import ValidationError

from app.schemas import (
    AnalyzeJobRequest,
    AnalyzeJobResult,
    QuickCheckRequest,
    QuickCheckResult,
    RecommendationItemPayload,
    StyleProfilePayload,
)


class TestAnalyzeJobRequest:
    def test_valid_request(self):
        req = AnalyzeJobRequest(
            session_id="s1",
            user_id="u1",
            asset_id="a1",
            bucket="selfies",
            storage_path="u1/photo.jpg",
        )
        assert req.session_id == "s1"

    def test_missing_required_field(self):
        with pytest.raises(ValidationError):
            AnalyzeJobRequest(session_id="s1", user_id="u1")  # type: ignore[call-arg]


class TestStyleProfilePayload:
    def test_valid_profile(self):
        p = StyleProfilePayload(
            undertone_label="Warm Neutral",
            undertone_confidence=0.87,
            contrast_label="Medium Contrast",
            contrast_confidence=0.81,
            palette_json={"core": ["Rust"]},
            avoid_colors_json=["Icy Grey"],
            fit_explanation="Warm profile.",
        )
        assert p.undertone_label == "Warm Neutral"


class TestRecommendationItemPayload:
    def test_score_range(self):
        with pytest.raises(ValidationError):
            RecommendationItemPayload(
                title="Item",
                category="Top",
                reason="Good",
                score=1.5,  # out of range
                price_label="$50",
                merchant_url="https://example.com",
            )

    def test_valid_item(self):
        item = RecommendationItemPayload(
            title="Navy Blazer",
            category="Outerwear",
            reason="Frames the face.",
            score=0.94,
            price_label="$88",
            merchant_url="https://example.com/blazer",
        )
        assert item.score == 0.94


class TestQuickCheckRequest:
    def test_defaults(self):
        req = QuickCheckRequest(
            asset_id="a1",
            bucket="wardrobe",
            storage_path="u1/shirt.jpg",
        )
        assert req.undertone_label == ""
        assert req.palette_json == {}
        assert req.avoid_colors_json == []


class TestQuickCheckResult:
    def test_score_clamped(self):
        with pytest.raises(ValidationError):
            QuickCheckResult(
                label="Good fit",
                score=-0.1,
                confidence=0.8,
                best_use="Versatile",
                reason="OK",
                color_family="warm",
            )

    def test_clothing_check_optional(self):
        result = QuickCheckResult(
            label="Good fit",
            score=0.9,
            confidence=0.82,
            best_use="Near face",
            reason="Warm tones.",
            color_family="warm earthy",
        )
        assert result.clothing_check is None


class TestAnalyzeJobResult:
    def test_full_result(self):
        result = AnalyzeJobResult(
            quality_score=0.88,
            light_score=0.82,
            confidence_score=0.86,
            style_profile=StyleProfilePayload(
                undertone_label="Warm Neutral",
                undertone_confidence=0.87,
                contrast_label="Medium Contrast",
                contrast_confidence=0.81,
                palette_json={"core": ["Rust"], "neutrals": ["Stone"]},
                avoid_colors_json=["Icy Grey"],
                fit_explanation="Good profile.",
            ),
            recommendation_items=[
                RecommendationItemPayload(
                    title="Blazer",
                    category="Outerwear",
                    reason="Nice.",
                    score=0.94,
                    price_label="$88",
                    merchant_url="https://example.com/blazer",
                ),
            ],
        )
        assert result.llm_interpretation is None
        assert len(result.recommendation_items) == 1
