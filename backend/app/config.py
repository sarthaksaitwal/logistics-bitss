from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    osrm_url: str = "http://router.project-osrm.org"
    osrm_profile: str = "driving"
    osrm_timeout_s: float = 10.0
    solver_time_limit_ms: int = 1000
    max_stops: int = 25
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
