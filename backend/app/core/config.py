from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "aiml-bms-system"
    app_env: str = "dev"

    database_url: str = "postgresql+psycopg://aimlbms:aimlbms@localhost:5432/aimlbms"
    allow_origins: str = "http://localhost:5173"
    data_dir: str = "data"

    # JWT / Auth (set via env; never commit real secrets)
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    @property
    def allow_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allow_origins.split(",") if o.strip()]

    @property
    def data_path(self) -> Path:
        return Path(self.data_dir).resolve()

    @property
    def feature_dir(self) -> Path:
        return self.data_path / "processed" / "features"

    @property
    def timeseries_dir(self) -> Path:
        return self.data_path / "processed" / "time_series"


settings = Settings()
