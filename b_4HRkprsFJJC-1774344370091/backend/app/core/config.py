from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Server
    app_name: str = "Drop-off Intelligence API"
    environment: str = "development"
    log_level: str = "INFO"

    # Database
    database_url: str

    # Security
    secret_key: str
    api_key: str

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""

    # Rate Limiting
    rate_limit_per_minute: int = 100

    # Business thresholds
    high_error_threshold: int = 5
    slow_step_threshold_seconds: int = 60


@lru_cache
def get_settings() -> Settings:
    return Settings()
