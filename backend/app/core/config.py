from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "aiml-bms-system"
    app_env: str = "dev"

    database_url: str = "mysql+pymysql://root:12345@localhost:3306/aimlbms"
    allow_origins: str = "http://localhost:5173"
    data_dir: str = "./data"

    @property
    def allow_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allow_origins.split(",") if o.strip()]

    @property
    def data_path(self) -> Path:
        # backend/ is expected to be the working directory; ./data -> backend/data
        return Path(self.data_dir).resolve()


settings = Settings()
