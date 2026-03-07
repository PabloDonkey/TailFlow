from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    database_url: str = "postgresql+psycopg://user:password@localhost:5432/tailflow"
    storage_path: str = "./storage/images"
    max_upload_size_mb: int = 50
    classifier_enabled: bool = False


settings = Settings()
