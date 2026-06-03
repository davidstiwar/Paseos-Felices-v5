from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import json

class BaseServiceSettings(BaseSettings):
    SECRET_KEY: str = "super-secret-key-change-in-production-2026-paseosfelices"
    ALGORITHM: str = "HS256"

    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            raw = v.strip()
            # Soporte para formato JSON tipo: ["http://localhost:3000","http://127.0.0.1:3000"]
            if raw.startswith("[") and raw.endswith("]"):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        return [str(o).strip() for o in parsed if str(o).strip()]
                except Exception:
                    # si falla, caemos al split por comas
                    pass
            return [origin.strip().strip('"').strip("'") for origin in raw.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
