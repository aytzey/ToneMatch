"""Tests for FastAPI endpoints (no external services required)."""

from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.settings import settings


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_header():
    return {"x-shared-secret": settings.ai_worker_shared_secret}


def _make_test_image() -> bytes:
    img = Image.new("RGB", (400, 400), (200, 155, 115))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


class TestHealthz:
    def test_healthz(self, client: TestClient):
        response = client.get("/healthz")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["service"] == "tone-match-ai-worker"


class TestAnalyzeJob:
    def test_unauthorized(self, client: TestClient):
        response = client.post(
            "/jobs/analyze",
            json={
                "session_id": "s1",
                "user_id": "u1",
                "asset_id": "a1",
                "bucket": "selfies",
                "storage_path": "test/photo.jpg",
            },
            headers={"x-shared-secret": "wrong-secret"},
        )
        assert response.status_code == 401

    def test_dry_run_no_supabase(self, client: TestClient, auth_header: dict):
        """Without Supabase config, should return dry-run mode."""
        response = client.post(
            "/jobs/analyze",
            json={
                "session_id": "s1",
                "user_id": "u1",
                "asset_id": "a1",
                "bucket": "selfies",
                "storage_path": "test/photo.jpg",
            },
            headers=auth_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["mode"] == "dry-run"
        result = data["result"]
        assert "style_profile" in result
        assert "recommendation_items" in result
        assert result["quality_score"] > 0

    def test_dry_run_profile_fields(self, client: TestClient, auth_header: dict):
        response = client.post(
            "/jobs/analyze",
            json={
                "session_id": "s1",
                "user_id": "u1",
                "asset_id": "a1",
                "bucket": "selfies",
                "storage_path": "test/photo.jpg",
            },
            headers=auth_header,
        )
        profile = response.json()["result"]["style_profile"]
        assert profile["undertone_label"] in ("Warm Neutral", "Cool Bright", "Olive Soft")
        assert profile["contrast_label"] in ("Low Contrast", "Medium Contrast", "High Contrast")
        assert 0.0 < profile["undertone_confidence"] <= 1.0
        assert 0.0 < profile["contrast_confidence"] <= 1.0
        assert isinstance(profile["palette_json"], dict)
        assert isinstance(profile["avoid_colors_json"], list)


class TestQuickCheck:
    def test_unauthorized(self, client: TestClient):
        response = client.post(
            "/jobs/quick-check",
            json={
                "asset_id": "a1",
                "bucket": "wardrobe",
                "storage_path": "test/shirt.jpg",
            },
            headers={"x-shared-secret": "wrong"},
        )
        assert response.status_code == 401

    def test_dry_run_no_supabase(self, client: TestClient, auth_header: dict):
        response = client.post(
            "/jobs/quick-check",
            json={
                "asset_id": "a1",
                "bucket": "wardrobe",
                "storage_path": "test/shirt.jpg",
            },
            headers=auth_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        result = data["result"]
        assert result["label"] in ("Good fit", "Context dependent", "Borderline", "Not a match")
        assert 0.0 <= result["score"] <= 1.0

    def test_missing_fields(self, client: TestClient, auth_header: dict):
        """Missing required fields should return 422."""
        response = client.post(
            "/jobs/quick-check",
            json={"asset_id": "a1"},
            headers=auth_header,
        )
        assert response.status_code == 422
