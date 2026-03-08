from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    ai_worker_shared_secret: str = "replace-me"
    storage_request_timeout: float = 20.0

    openrouter_api_key: str = ""
    llm_model: str = "google/gemini-3-flash-preview"
    llm_timeout: float = 60.0

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
