from pydantic import BaseModel, Field


class AnalyzeJobRequest(BaseModel):
    session_id: str
    user_id: str
    asset_id: str
    bucket: str
    storage_path: str


class StyleProfilePayload(BaseModel):
    undertone_label: str
    undertone_confidence: float
    contrast_label: str
    contrast_confidence: float
    palette_json: dict
    avoid_colors_json: list[str]
    fit_explanation: str


class RecommendationItemPayload(BaseModel):
    title: str
    category: str
    reason: str
    score: float = Field(ge=0, le=1)
    price_label: str
    merchant_url: str
    metadata: dict = Field(default_factory=dict)


class AnalyzeJobResult(BaseModel):
    quality_score: float
    light_score: float
    confidence_score: float
    style_profile: StyleProfilePayload
    recommendation_items: list[RecommendationItemPayload]
    raw_signals: dict | None = None
    llm_interpretation: dict | None = None


class QuickCheckRequest(BaseModel):
    asset_id: str
    bucket: str
    storage_path: str
    # User profile fields — passed by the edge function for LLM clothing check
    undertone_label: str = ""
    contrast_label: str = ""
    palette_json: dict = Field(default_factory=dict)
    avoid_colors_json: list[str] = Field(default_factory=list)


class QuickCheckResult(BaseModel):
    label: str
    score: float = Field(ge=0, le=1)
    confidence: float = Field(ge=0, le=1)
    best_use: str
    reason: str
    color_family: str
    clothing_check: dict | None = None
