from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    MONGODB_URL: str
    DATABASE_NAME: str

    OPENAI_API_KEY: str = ""
    MODEL_NAME: str = "gpt-4.1-mini"
    TEMPERATURE: float = 0.2

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()